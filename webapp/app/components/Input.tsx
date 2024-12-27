import { FocusEventHandler } from "react";

type InputProps = {
  type?: "text" | "textarea" | "dropdown";
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function Input(props: InputProps) {
  const { type = "text", name, value } = props;

  const commonProps = {
    value,
    name,
    onChange: props.onChange,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    autoComplete: "off",
  };

  return (
    <div className="flex flex-col">
      <label className="text-sm" htmlFor={name}>
        {props.label}
      </label>
      {type == "textarea" ? (
        <textarea
          style={{
            minHeight: "130px",
          }}
          {...commonProps}
        />
      ) : (
        <input
          style={{ maxHeight: "40px" }}
          type={type || "text"}
          {...commonProps}
        />
      )}
    </div>
  );
}
