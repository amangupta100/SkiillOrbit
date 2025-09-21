import React from "react";
import ButtonLoader from "@/utils/Loader";

const Button = ({
  children,
  loading = false,
  canSubmit = true,
  type = "button",
  className = "",
  onClick,
  ...props
}) => {
  const isDisabled = loading || !canSubmit;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={`w-full px-3 flex justify-center items-center py-2 rounded-lg shadow-xs 
        text-primary-foreground 
        ${isDisabled ? "cursor-not-allowed bg-gray-500/40" : "cursor-pointer"} 
        ${className}`}
      {...props}
    >
      {loading ? (
        <ButtonLoader />
      ) : (
        <span className="text-[16px]">{children}</span>
      )}
    </button>
  );
};

export default Button;
