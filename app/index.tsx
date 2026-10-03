import "../global.css"
import { Text, View } from "react-native";
import onboarding from "@/app/onboarding";
import {Link} from "expo-router";

export default function App() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-xl font-bold text-success">
                Welcome to Nativewind!
            </Text>
            <Link href="/onboarding">On boarding</Link>
            <Link href="/(auth)/sign-up">Sign Up</Link>
        </View>
    );
}