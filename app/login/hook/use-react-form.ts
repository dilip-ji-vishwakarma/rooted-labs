/* eslint-disable @typescript-eslint/no-explicit-any */
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

type UseUserformType = {
  onFormSubmit: (prop: any) => Promise<any>;
};

// Schema for User form
const formSchema = z.object({
  username: z
    .string({ message: "Username is required." })
    .min(1, { message: "Username is required." }),
  password: z
    .string({ message: "Password is required." })
    .min(1, { message: "Password is required." }),
});

export const useReactForm = ({ onFormSubmit }: UseUserformType) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload = values;

    const response = await onFormSubmit(payload);
    if (response?.data) {
      form.reset();
    }
  }

  return { form, onSubmit };
};
