import { ShieldAlertIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";

import {
    Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";

export const UnauthenticatedView = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-lg bg-muted">
                <Item variant="outline">
                    <ItemMedia variant="icon">
                        <ShieldAlertIcon />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>
                            Unauthorized
                        </ItemTitle>
                        <ItemDescription>
                            Please sign in to access this page.
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <SignInButton>
                            <Button variant="outline" size="sm">
                                Sign In
                            </Button>
                        </SignInButton>
                    </ItemActions>
                </Item>
            </div>
        </div>
    );
}