import Icon from "./Icon";

// Pick ONE (level). options: [{ value, label }]
export function SingleChoice({ label, options, value, onChange }) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="seg">
        {options.map(function (option) {
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={option.value === value}
              onClick={function () { onChange(option.value); }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Pick ANY (employment types, workplace). values: the picked option values.
export function MultiChoice({ label, options, values, onChange }) {
  function toggle(optionValue) {
    if (values.includes(optionValue)) {
      const remaining = [];
      for (const value of values) {
        if (value !== optionValue) {
          remaining.push(value);
        }
      }
      onChange(remaining);
    } else {
      onChange([...values, optionValue]);
    }
  }

  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="checks">
        {options.map(function (option) {
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={values.includes(option.value)}
              onClick={function () { toggle(option.value); }}
            >
              <span className="box"><Icon name="check" /></span>
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
