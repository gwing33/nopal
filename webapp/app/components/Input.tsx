type InputProps = {
  type?: "text" | "textarea" | "dropdown";
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
};

export function Input(props: InputProps) {
  const { type = "text", name, value } = props;
  return (
    <div className="flex flex-col">
      <label htmlFor={name}>{props.label}</label>
      {type == "textarea" ? (
        <textarea
          style={{ borderColor: "#BAA9C0", minHeight: "130px" }}
          className="border rounded p-2"
          value={value}
          onChange={props.onChange}
          name={name}
          placeholder={props.placeholder}
        />
      ) : (
        <input
          style={{ borderColor: "#BAA9C0", maxHeight: "40px" }}
          className="border rounded p-2"
          value={value}
          onChange={props.onChange}
          name={name}
          type={type || "text"}
          placeholder={props.placeholder}
        />
      )}
    </div>
  );
}
