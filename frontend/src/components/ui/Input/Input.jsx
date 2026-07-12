import './Input.css'

export default function Input({ type = "text", name, className = "", ...rest }) {
    const inputIdentifier = name || type || "text";
    const camelCasedClassName = `input${inputIdentifier.charAt(0).toUpperCase() + inputIdentifier.slice(1)}`;

    return (
        <input
            type={type}
            id={name}
            className={`${camelCasedClassName} ${className}`.trim()}
            name={name}
            {...rest}
        />
    );
}