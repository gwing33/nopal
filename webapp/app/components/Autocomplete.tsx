import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Input } from "./Input";
import { useClickOutside } from "../hooks/useClickOutside";

type OptionObject = {
  label: string;
  id: string | number;
};

type AutocompleteProps<T extends string | OptionObject> = {
  label: string;
  name: string;
  value: string;
  onChange: (val: T) => void;
  options: T[];
};

export function Autocomplete<T extends string | OptionObject>({
  options,
  onChange,
  ...props
}: AutocompleteProps<T>) {
  const ref = useRef(null);
  const [searchVal, _setSearch] = useState(props.value);
  const [show, setShow] = useState(false);
  const setSearch = (val: string) => {
    _setSearch(val);
    setShow(true);
  };
  const isExactMatch = useMemo(() => {
    return options.some((option) => {
      return (
        (typeof option == "string" ? option : option.label).toLowerCase() ==
        searchVal.toLowerCase()
      );
    });
  }, [options, searchVal]);
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      // show all
      if (!searchVal || isExactMatch) {
        return true;
      }
      const optionVal = typeof option == "string" ? option : option.label;
      return optionVal.toLowerCase().includes(searchVal.toLowerCase());
    });
  }, [options, searchVal, isExactMatch]);

  const clearSearch = useCallback(() => {
    if (!isExactMatch) {
      setSearch("");
    }
    setShow(false);
  }, [isExactMatch]);

  useClickOutside(ref, clearSearch);

  const showingOptions = show && filteredOptions.length > 0;

  return (
    <div className="autocomplete" ref={ref}>
      <Input
        label={props.label}
        name={props.name}
        value={searchVal}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        onFocus={() => {
          setShow(true);
        }}
      />
      <a onClick={() => setShow(!show)}>
        <DropdownTick
          flip={!showingOptions}
          color={showingOptions ? "var(--purple-light)" : "#baa9c0"}
        />
      </a>
      <div style={{ position: "relative" }}>
        {showingOptions && (
          <Options
            options={filteredOptions}
            onChange={(val) => {
              onChange(val);
              setSearch(typeof val == "string" ? val : val.label);
              setShow(false);
            }}
            onClear={clearSearch}
          />
        )}
      </div>
    </div>
  );
}

type OptionsProps<T extends string | OptionObject> = {
  options: T[];
  onChange: (val: T) => void;
  onClear: () => void;
};
function Options<T extends string | OptionObject>({
  options,
  onChange,
  onClear,
}: OptionsProps<T>) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const maxIndex = options.length - 1;
          const downIndex = index + 1;
          const newIndex = downIndex > maxIndex ? maxIndex : downIndex;
          setIndex(newIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          const upIndex = index - 1;
          setIndex(upIndex < 0 ? 0 : upIndex);
          break;
        case "Escape":
          e.preventDefault();
          onClear();
          break;
        case "Enter":
          e.preventDefault();
          const option = options[index];
          setIndex(0);
          onChange(option);
          break;
        case "Tab":
          setIndex(0);
          onClear();
          break;
      }
    };
    document.addEventListener("keydown", cb);
    return () => document.removeEventListener("keydown", cb);
  }, [options, index, onChange, onClear]);

  return (
    <div
      className="options border z-10"
      style={{
        position: "absolute",
        left: "5px",
        right: "5px",
        top: "-5px",
        borderRadius: "4px",
        borderTopRightRadius: 0,
      }}
    >
      {options.map((option) => {
        const highlight = option == options[index];
        return (
          <div
            key={typeof option == "string" ? option : option.id}
            onClick={() => onChange(option)}
            className={
              "option cursor-pointer p-2" + (highlight ? " highlight" : "")
            }
          >
            {typeof option == "string" ? option : option.label}
          </div>
        );
      })}
    </div>
  );
}

function DropdownTick({ color, flip }: { color?: string; flip?: boolean }) {
  return (
    <svg
      style={{
        position: "absolute",
        right: "4px",
        bottom: "4px",
        transform: flip ? "scaleX(-1)" : "",
      }}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
    >
      <path
        d="M14.1426 4.82826L14.1425 14.142L4.82857 14.1418C3.04675 14.1417 2.15446 11.9874 3.41443 10.7275L10.7284 3.41399C11.9883 2.15411 14.1426 3.04647 14.1426 4.82826Z"
        fill={color}
      />
    </svg>
  );
}
