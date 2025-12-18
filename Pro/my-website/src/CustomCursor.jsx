import React, { useEffect, useState } from "react";

const CustomCursor = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <img
      src="/src/assets/18.png"
      alt="cursor"
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: "40px",
        height: "40px",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

export default CustomCursor;
