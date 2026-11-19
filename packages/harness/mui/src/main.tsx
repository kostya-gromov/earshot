/*
 * MUI Autocomplete with `multiple`, built as the first ("standard") field of the "Multiple values"
 * docs example (docs/data/material/components/autocomplete/Tags.tsx at tag v9.5.0,
 * https://mui.com/material-ui/react-autocomplete/#multiple-values). Props we set, and why:
 * - multiple, options, value with onChange: the example's controlled selection; options are the
 *   reference's directory, the value starts with its three people.
 * - slotProps.chip aria-description "Press Backspace or Delete to remove", and the input's
 *   aria-description "N selected. From the start of the input, press Left Arrow to focus the
 *   selected items": copied word for word from the example.
 * - TextField variant "standard" from the example, label "To" instead of "Multiple values", no
 *   placeholder (the reference has none).
 * - No ThemeProvider: the example uses MUI's default theme.
 * Everything else is the component's default.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { directory, initialPeople } from '../../shared/people.ts';

const removeDescription = 'Press Backspace or Delete to remove';

function getInputDescription(valueLength: number) {
  return valueLength > 0
    ? `${valueLength} selected. From the start of the input, press Left Arrow to focus the selected items`
    : undefined;
}

function People() {
  const [value, setValue] = useState<string[]>([...initialPeople]);
  return (
    <Autocomplete
      multiple
      id="tags-standard"
      options={[...directory]}
      value={value}
      onChange={(_, next) => setValue(next)}
      slotProps={{ chip: { 'aria-description': removeDescription } }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="To"
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-description': getInputDescription(value.length),
            },
          }}
        />
      )}
    />
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <People />
    </StrictMode>,
  );
}
