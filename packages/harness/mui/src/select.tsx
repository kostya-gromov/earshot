/*
 * MUI Select built as the "Basic select" docs example, the first on
 * https://mui.com/material-ui/react-select/#basic-select (read 2026-11-24, @mui/material 9.5.0).
 * The example's code is
 *   <FormControl fullWidth>
 *     <InputLabel id="demo-simple-select-label">Age</InputLabel>
 *     <Select labelId="demo-simple-select-label" id="demo-simple-select" value={age}
 *       label="Age" onChange={handleChange}> <MenuItem value={10}>Ten</MenuItem> … </Select>
 *   </FormControl>
 * Props we set, and why:
 * - FormControl fullWidth, InputLabel with an id, Select with labelId, id, value, label and
 *   onChange: as the example has them; the page's Accessibility section asks for the labelId.
 * - The label "Fruit" instead of "Age", ids named after it, and the five fruit every select
 *   target gets as MenuItems, with Banana chosen.
 * - No ThemeProvider: the example uses MUI's default theme.
 * Everything else is the component's default.
 * Not followed: NativeSelect (the browser's own select, data/targets.yaml), and the TextField
 * with `select`, which the page offers as a second way to label it.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import { selectFruit, selectValue } from '../../shared/select-fruit.ts';

function Fruit() {
  const [fruit, setFruit] = useState<string>(selectValue);
  const handleChange = (event: SelectChangeEvent) => setFruit(event.target.value);
  return (
    <FormControl fullWidth>
      <InputLabel id="fruit-select-label">Fruit</InputLabel>
      <Select
        labelId="fruit-select-label"
        id="fruit-select"
        value={fruit}
        label="Fruit"
        onChange={handleChange}
      >
        {selectFruit.map((name) => (
          <MenuItem key={name} value={name}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
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
