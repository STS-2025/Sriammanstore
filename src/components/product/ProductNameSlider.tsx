import { useEffect, useRef, useState, type CSSProperties } from "react";

export function ProductNameSlider({ name }: { name: string }) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!viewport || !text) return;

    const measure = () => {
      const nextOverflow = Math.max(0, Math.ceil(text.scrollWidth - viewport.clientWidth));
      setOverflow((current) => (current === nextOverflow ? current : nextOverflow));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(text);
    return () => observer.disconnect();
  }, [name]);

  return (
    <span
      ref={viewportRef}
      className="product-name-slider-viewport block overflow-hidden whitespace-nowrap sm:overflow-visible sm:whitespace-normal"
      aria-label={name}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap sm:whitespace-normal ${overflow ? "product-name-slider" : ""}`}
        style={overflow ? ({ "--product-name-overflow": `-${overflow}px` } as CSSProperties) : undefined}
      >
        {name}
      </span>
    </span>
  );
}
