import './Button.css'

export default function Button({ text, onClick, className = "", ...rest }) {
    return (
        <button className={`customButton ${className}`.trim()} onClick={onClick} {...rest}>
            {text}
        </button>
    );
}