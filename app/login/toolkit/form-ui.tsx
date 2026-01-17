/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/shared/form-fields/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useReactForm } from "../hook/use-react-form";
import { GraduationCap, School, Users } from "lucide-react";

type FormUiProps = {
  onFormSubmit: (payload: any) => Promise<any>;
  role: "student" | "teacher" | null;
};

export const FormUi: React.FC<FormUiProps> = ({ onFormSubmit, role }) => {
  const { form, onSubmit } = useReactForm({
    onFormSubmit,
  });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  {role === "teacher" ? "Teacher ID" : "Student ID"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Username"
                      className="w-full h-12 pl-12 pr-4 py-4 bg-[#eef5fc] border border-transparent focus:border-blue-500 rounded-xl text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute z-10 inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {role === "student" ? (
                      <School className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    )}
                  </div>

                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="••••••••"
                      className="w-full h-12 pl-12 pr-12 py-4 bg-[#eef5fc] border border-transparent focus:border-blue-500 rounded-xl text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
          >
            {form.formState.isSubmitting && <Spinner />}
            Login
          </Button>
        </form>
      </Form>
    </>
  );
};
