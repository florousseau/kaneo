import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

type BoardHeaderSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Title search that slides into the board header on Ctrl/Cmd+F. */
export default function BoardHeaderSearch({
  value,
  onChange,
}: BoardHeaderSearchProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  const open = useCallback(() => {
    setIsMounted(true);
    window.requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => setIsMounted(false), 180);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isFindShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f";

      if (!isFindShortcut) return;

      event.preventDefault();
      open();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!isMounted) return;
    window.requestAnimationFrame(() => input?.focus());
  }, [isMounted, input]);

  if (!isMounted) return null;

  return (
    <div
      className={`relative w-[240px] origin-top transition-[translate,scale,opacity] duration-180 ease-out ${
        isVisible
          ? "translate-y-0 scale-y-100 opacity-100"
          : "pointer-events-none -translate-y-1 scale-y-95 opacity-0"
      }`}
    >
      <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        ref={setInput}
        value={value}
        maxLength={256}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !value.trim()) {
            close();
          }
        }}
        onBlur={() => {
          if (!value.trim()) {
            close();
          }
        }}
        placeholder={t("tasks:boardSearchPlaceholder")}
        className="h-7.5 [&_[data-slot=input]]:h-7 [&_[data-slot=input]]:leading-7 [&_[data-slot=input]]:pl-8 [&_[data-slot=input]]:text-xs [&_[data-slot=input]]:placeholder:text-xs [&_[data-slot=input]]:placeholder:leading-7"
      />
    </div>
  );
}
