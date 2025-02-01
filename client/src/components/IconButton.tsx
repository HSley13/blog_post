import React from "react";

type IconButtonProps = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  isActive?: boolean;
  color?: string;
  children?: React.ReactNode;
};

export const IconButton = ({
  Icon,
  onClick,
  isActive,
  color,
  children,
}: IconButtonProps) => {
  return (
    <button
      className={`btn icon-btn ${isActive ? "icon-btn-active" : ""} ${color || ""}`}
      onClick={onClick}
      style={color ? { color } : undefined}
    >
      <span className={children != null ? "mr-1" : ""}>
        <Icon />
      </span>
      {children}
    </button>
  );
};
