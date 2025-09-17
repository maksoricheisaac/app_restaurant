"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signUp, signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const signUpSchema = z.object({
	name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
	email: z.string().email("Email invalide"),
	password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Les mots de passe ne correspondent pas",
	path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = async (data: SignUpFormData) => {
		setLoading(true);
		try {
			await signUp.email({
				email: data.email,
				password: data.password,
				name: data.name,
				callbackURL: "/",
				fetchOptions: {
					onResponse: () => {
						setLoading(false);
					},
					onRequest: () => {
						setLoading(true);
					},
					onError: (ctx) => {
						toast.error(ctx.error.message || "Erreur lors de l'inscription");
						setLoading(false);
					},
					onSuccess: async () => {
						toast.success("Inscription réussie !");
						router.push("/");
					},
				},
			});
		} catch {
			setLoading(false);
			toast.error("Erreur lors de l'inscription");
		}
	};

	const handleGoogleSignUp = async () => {
		setGoogleLoading(true);
		try {
			await signIn.social(
				{
					provider: "google",
					callbackURL: "/",
				},
				{
					onRequest: () => {
						setGoogleLoading(true);
					},
					onResponse: () => {
						setGoogleLoading(false);
					},
					onError: () => {
						toast.error("Erreur lors de la connexion avec Google");
						setGoogleLoading(false);
					},
					onSuccess: () => {
						toast.success("Connexion avec Google réussie !");
						router.push("/");
					},
				}
			);
		} catch {
			setGoogleLoading(false);
			toast.error("Erreur lors de la connexion avec Google");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
				<CardHeader className="text-center space-y-2">
					<div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
						<User className="w-6 h-6 text-orange-600" />
					</div>
					<CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
						Créer un compte
					</CardTitle>
					<CardDescription className="text-gray-600">
						Inscrivez-vous avec votre email ou Google
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="name" className="text-sm font-medium text-gray-700">
								Nom complet
							</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<Input
									id="name"
									type="text"
									placeholder="Votre nom complet"
									{...register("name")}
									className={`pl-10 h-12 transition-all duration-200 ${
										errors.name 
											? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
											: "border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
									}`}
								/>
							</div>
							{errors.name && (
								<p className="text-sm text-red-500 flex items-center gap-1 mt-1">
									<span className="w-1 h-1 bg-red-500 rounded-full"></span>
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email" className="text-sm font-medium text-gray-700">
								Email
							</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<Input
									id="email"
									type="email"
									placeholder="votre@email.com"
									{...register("email")}
									className={`pl-10 h-12 transition-all duration-200 ${
										errors.email 
											? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
											: "border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
									}`}
								/>
							</div>
							{errors.email && (
								<p className="text-sm text-red-500 flex items-center gap-1 mt-1">
									<span className="w-1 h-1 bg-red-500 rounded-full"></span>
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-sm font-medium text-gray-700">
								Mot de passe
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Votre mot de passe"
									{...register("password")}
									className={`pl-10 pr-10 h-12 transition-all duration-200 ${
										errors.password 
											? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
											: "border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
									}`}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.password && (
								<p className="text-sm text-red-500 flex items-center gap-1 mt-1">
									<span className="w-1 h-1 bg-red-500 rounded-full"></span>
									{errors.password.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
								Confirmer le mot de passe
							</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Confirmez votre mot de passe"
									{...register("confirmPassword")}
									className={`pl-10 pr-10 h-12 transition-all duration-200 ${
										errors.confirmPassword 
											? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
											: "border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
									}`}
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
								>
									{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							{errors.confirmPassword && (
								<p className="text-sm text-red-500 flex items-center gap-1 mt-1">
									<span className="w-1 h-1 bg-red-500 rounded-full"></span>
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 size={16} className="animate-spin mr-2" />
									Cr&eacute;ation du compte...
								</>
							) : (
								"Créer un compte"
							)}
						</Button>
					</form>

					<div className="relative my-8">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-gray-200" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-4 text-gray-500 font-medium">
								Ou continuer avec
							</span>
						</div>
					</div>

					<Button
						variant="outline"
						className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
						disabled={googleLoading}
						onClick={handleGoogleSignUp}
					>
						{googleLoading ? (
							<>
								<Loader2 size={16} className="animate-spin mr-2" />
								Connexion...
							</>
						) : (
							<>
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									width="18" 
									height="18" 
									viewBox="0 0 256 262" 
									className="mr-3"
								>
									<path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
									<path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
									<path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
									<path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
								</svg>
								S&apos;inscrire avec Google
							</>
						)}
					</Button>
				</CardContent>
				<CardFooter>
					<div className="flex justify-center w-full border-t border-gray-100 py-6">
						<p className="text-center text-sm text-gray-600">
							Déjà un compte ?{" "}
							<Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
								Se connecter
							</Link>
						</p>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}