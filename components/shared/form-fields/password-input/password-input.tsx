/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { IconPicker, Icon } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
export const PasswordInput = ({
  value,
  onChange,
  placeholder,
  className,
}: any) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <div className="relative w-full">
      <Input
        className={cn(className)}
        placeholder={placeholder}
        type={passwordVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
      />
      <Button
        variant="ghost"
        onClick={() => setPasswordVisible(!passwordVisible)}
        className="absolute  right-0 top-0 bottom-0 my-auto"
        size={"icon"}
        type="button"
      >
        <Icon
          name={passwordVisible ? "eye" : "eye-off"}
          strokeWidth={1}
          size={17}
        />
      </Button>
    </div>
  );
};
