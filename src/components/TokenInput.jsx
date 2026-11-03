import { useState } from "react";
import Icon from "./Icon";

// A list of words the user types one by one (job titles, skills, places).
// Enter or comma adds the word. Backspace on an empty box removes the last one.
export default function TokenInput({ label, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function addDraft() {
    const word = draft.trim();
    if (word === "") {
      return;
    }
    if (!values.includes(word)) {
      onChange([...values, word]);
    }
    setDraft("");
  }

  function removeValue(valueToRemove) {
    const remaining = [];
    for (const value of values) {
      if (value !== valueToRemove) {
        remaining.push(value);
      }
    }
    onChange(remaining);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDraft();
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, values.length - 1));
    }
  }

  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="tokens">
        {values.map(function (value) {
          return (
            <span className="token" key={value}>
              {value}
              <button type="button" aria-label={"Remove " + value} onClick={function () { removeValue(value); }}>
                <Icon name="x" />
              </button>
            </span>
          );
        })}
        <input
          aria-label={"Add to " + label}
          placeholder={placeholder}
          value={draft}
          onChange={function (event) { setDraft(event.target.value); }}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
        />
      </div>
    </fieldset>
  );
}
