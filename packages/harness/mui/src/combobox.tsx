/*
 * MUI Autocomplete with a single value, built as the "Combo box" docs example, the first on
 * https://mui.com/material-ui/react-autocomplete/#combo-box (read 2026-11-14, @mui/material
 * 9.5.0). The example's code is
 *   <Autocomplete disablePortal options={top100Films} sx={{ width: 300 }}
 *     renderInput={(params) => <TextField {...params} label="Movie" />} />
 * Props we set, and why:
 * - disablePortal, sx width 300, renderInput with a TextField: as the example has them. The
 *   example itself renders the popup inside the field, so the page does too.
 * - options: the six fruit every combobox target gets, instead of the example's films.
 * - TextField label "Fruit" instead of "Movie".
 * - No ThemeProvider: the example uses MUI's default theme.
 * Everything else is the component's default.
 * Not followed: the page's other form, freeSolo ("the textbox can contain any arbitrary value").
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { fruit } from '../../shared/fruit.ts';

function Fruit() {
  return (
    <Autocomplete
      disablePortal
      options={[...fruit]}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Fruit" />}
    />
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Fruit />
    </StrictMode>,
  );
}
