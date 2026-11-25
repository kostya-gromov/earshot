import { publicRepository } from '@/lib/correction-link';
import type { Measurement, Verdict } from '@earshot/contracts';
import { VerdictBadge } from '@/features/evidence';
import { measuredOn } from '@/lib/measured-on';
import { Part } from './how-we-measure';
import styles from './methodology.module.css';
import { ExternalLink } from '@/ui';

/** The word with the mark it carries on the pattern page, so the two can be matched. */
function Term({ verdict, children }: { verdict: Verdict; children: string }) {
  return (
    <dt className={styles.verdictTerm}>
      <span aria-hidden="true">
        <VerdictBadge verdict={verdict} isMarkOnly />
      </span>
      {children}
    </dt>
  );
}

export function Verdicts() {
  return (
    <Part id="verdicts" title="Verdicts">
      <dl>
        <Term verdict="follows">Follows</Term>
        <dd>
          At least one scenario that exercises the rule behaved as the rule describes, and none
          showed a difference. Scenarios that could not judge the rule are listed as “Not judged”,
          and the verdict says on how many scenarios it rests, for example “Judged on 1 of 3
          scenarios”.
        </dd>
        <Term verdict="differs">Differs</Term>
        <dd>
          At least one scenario showed a stable, repeatable difference. A difference outranks a
          scenario that follows, and scenarios that could not judge the rule are listed as “Not
          judged”. Differing is not failing: each rule explains the trade-off of the alternative.
        </dd>
        <Term verdict="inconclusive">Inconclusive</Term>
        <dd>
          The engine could not decide: setup failed, the runs disagreed, or the page gave no way to
          tell, for example when nothing focusable follows the component, so leaving it cannot be
          told apart from losing focus. A rule is inconclusive only when no scenario could judge it,
          or when any of its runs could not be trusted. This is an honest result, shown with its
          reason.
        </dd>
        <Term verdict="not-applicable">Not applicable</Term>
        <dd>
          The rule does not apply to this component. For example, the rules about chips that act as
          one widget do not apply where the chips are separate controls in the Tab order, and Home
          and End are not asked of a menu whose arrow keys wrap. Not counted in agreement.
        </dd>
      </dl>
      <p>
        Agreement counts measured design systems only. The reference implementation is the baseline
        the rules are written from and never counts.
      </p>
    </Part>
  );
}

/** Where to look to verify a verdict: the raw file, and what it holds. */
function CheckYourself({
  system,
  rawHref,
}: {
  system: string | undefined;
  rawHref: string | undefined;
}) {
  return (
    <>
      <h3>Check a result yourself</h3>
      <p>
        The raw file linked on every result holds everything the verdict rests on: all three runs of
        every scenario, each key pressed, the focus, tree changes and announcements recorded after
        it, and the reason for each verdict in words.
        {system && rawHref && (
          <>
            {' '}
            <a href={rawHref}>Open the raw file for {system}</a>
          </>
        )}
      </p>
    </>
  );
}

interface ProvenanceProps {
  example: Measurement | undefined;
  /** The example's raw file, as the site serves it. */
  rawHref: string | undefined;
}

export function Provenance({ example, rawHref }: ProvenanceProps) {
  const provenance = example?.provenance.status === 'measured' ? example.provenance : undefined;
  return (
    <Part id="provenance" title="Provenance">
      <p>
        Every measurement file records where its values come from. Anything not produced by an
        engine run would be labelled illustrative and never counted; none is published.
      </p>
      {example && provenance && (
        <dl>
          <dt>System and version</dt>
          <dd>
            {example.target.system},{' '}
            {'reason' in example.target.systemVersion
              ? 'version unknown, with the reason'
              : example.target.systemVersion.version}
          </dd>
          <dt>Page</dt>
          <dd>
            {example.target.url.startsWith('https://') ? (
              <a href={example.target.url}>{example.target.url}</a>
            ) : (
              <code>{example.target.url}</code>
            )}
            , driven by the {example.target.adapter} adapter
          </dd>
          <dt>Browser and engine</dt>
          <dd>
            {provenance.browser.replace(/^chromium/, 'Chromium')}, engine {provenance.engineVersion}
          </dd>
          <dt>Date</dt>
          <dd>{measuredOn(provenance.measuredAt)}</dd>
          <dt>Runs</dt>
          <dd>
            {provenance.runs}, {provenance.consistent ? 'consistent' : 'inconsistent'}
          </dd>
        </dl>
      )}
      <p>
        Design systems are measured in our own harness: a page that renders each system’s published
        npm package at an exact version, with the same three people and a field before and after it,
        so every system starts from the same state. The props we set are listed in the page’s
        source; the system’s own docs demo is linked on every card. When a version cannot be read,
        it is recorded as unknown with the reason, never guessed.
      </p>
      <CheckYourself system={example?.target.system} rawHref={rawHref} />
    </Part>
  );
}

export function Limitations() {
  return (
    <Part id="limitations" title="Limitations">
      <p>What the measurements cannot tell you, stated plainly:</p>
      <ul>
        <li>Chromium only for now. Firefox and WebKit come later.</li>
        <li>No real screen reader runs yet; see the semantic model above.</li>
        <li>
          Nothing visual is measured: not contrast, not whether a focus ring can be seen, not target
          size. The design requirements on each pattern page cover those as guidance.
        </li>
        <li>Keyboard and mouse clicks only. Touch and voice input are not measured.</li>
        <li>
          A step is recorded until the page has been still for 400 ms. “Not announced” means nothing
          was announced in that time; an announcement that comes later is missed.
        </li>
        <li>
          Every scenario starts from three values selected and an empty input, in English. Other
          states, such as a disabled field or a long list of values, are not measured.
        </li>
        <li>
          A recording shows what happened, not why. When a system differs, the reason is the
          system’s to explain; the trade-offs on the pattern page are our reading.
        </li>
        <li>
          Checks by hand with a real screen reader are partial: a first VoiceOver spot check of
          input with chips, being repeated item by item (see the semantic model). Combobox, menu
          button and NVDA are not checked yet.
        </li>
        <li>
          Public demos differ from production use. A demo with nothing focusable after the component
          cannot show whether Tab leaves it; those results say so.
        </li>
      </ul>
    </Part>
  );
}

export function Corrections() {
  return (
    <Part id="corrections" title="Suggest a correction">
      <p>
        Corrections are public issues on GitHub. &ldquo;Suggest a correction&rdquo; on a
        system&rsquo;s card opens one whose title names the system, its version and the rule; add
        what you expected and how to see it: the page or package, the browser, the keys you pressed.
        For anything else,{' '}
        <ExternalLink href={`${publicRepository}/issues/new?template=correction.yml`}>
          open a correction
        </ExternalLink>
        .
      </p>
      <p>
        A verdict is never edited by hand. If the recording was wrong, the engine, the adapter or
        the page we render the system&rsquo;s component on is fixed and the system is measured
        again; if the rule or our reading of it was wrong, the rule changes and every system is
        judged again. Either way the change is listed under &ldquo;What changed, and when&rdquo;,
        with its date and the versions before and after. A correction we do not take is answered on
        the issue, with the reason.
      </p>
    </Part>
  );
}
