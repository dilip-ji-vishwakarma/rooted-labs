/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { motion } from "framer-motion";
import { Users, GraduationCap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormUi } from "./form-ui";
import { useSession } from "@/hooks/use-session";
import { saveSession } from "@/lib/auth";
import { toast } from "sonner";

export const PageBase = () => {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | null>(null);
  const { login } = useSession();
  const router = useRouter();

  const onSubmit = async (data: any) => {
    try {
      const res: any = await login({
        username: data?.username,
        password: data?.password,
      });

      if (res?.data) {
        await saveSession(res.data);
        toast.success("Login successful");
        router.push("/");
        return res;
      }

      toast.error(res?.error?.message || "Login failed");
      return res;
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
      return { error: err };
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-200/40 rounded-full blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl shadow-blue-500/10 p-8 sm:p-10 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 gap-4">
          <Image
            src={"/images/logos/rooted-logo.png"}
            alt="Rooted"
            width={800}
            height={800}
            className="h-10 sm:h-12 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome Back!
          </h1>
          {!selectedRole && (
            <p className="text-slate-500 text-sm sm:text-base font-medium">
              Choose your role to continue
            </p>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-slate-700 mb-4 text-center">
              I am a...
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedRole("student")}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 border-2 rounded-2xl transition-all cursor-pointer ${
                  selectedRole === "student" || !selectedRole
                    ? "bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-100"
                    : "bg-white border-slate-100 hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                    selectedRole === "student" || !selectedRole
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span
                  className={`font-bold transition-colors ${
                    selectedRole === "student" || !selectedRole
                      ? "text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  Student
                </span>
              </button>
              <button
                onClick={() => setSelectedRole("teacher")}
                className={`flex flex-col items-center justify-center p-4 sm:p-6 border-2 rounded-2xl transition-all cursor-pointer ${
                  selectedRole === "teacher"
                    ? "bg-purple-50/50 border-purple-500 shadow-md ring-2 ring-purple-100"
                    : "bg-white border-slate-100 hover:border-purple-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                    selectedRole === "teacher"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span
                  className={`font-bold transition-colors ${
                    selectedRole === "teacher"
                      ? "text-purple-700"
                      : "text-slate-500"
                  }`}
                >
                  Teacher
                </span>
              </button>
            </div>
          </div>
          <FormUi onFormSubmit={onSubmit} role={selectedRole}/>
        </div>
      </motion.div>
    </div>
  );
};
