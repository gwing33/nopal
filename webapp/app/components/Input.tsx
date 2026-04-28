import { FocusEventHandler } from "react";

type InputProps = {
  type?: "text" | "textarea" | "dropdown";
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  required?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  className?: string;
  placeholder?: string;
};

export function Input(props: InputProps) {
  const { type = "text", name, defaultValue, value, placeholder } = props;

  const commonProps = {
    defaultValue,
    value,
    name,
    onChange: props.onChange,
    onFocus: props.onFocus,
    onBlur: props.onBlur,
    autoComplete: "off",
    required: props.required,
    className: props.className,
    placeholder,
  };

  return (
    <div className="flex flex-col input-component">
      <label className="purple-text font-bold" htmlFor={name}>
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
