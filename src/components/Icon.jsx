// <Icon name="check" /> draws the matching symbol from Symbols.jsx.
export default function Icon({ name }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <use href={"#i-" + name} />
    </svg>
  );
}
