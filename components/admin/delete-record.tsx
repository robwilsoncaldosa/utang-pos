"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

type FormState = {
    message?: string;
    success?: boolean;
};

export function DeleteRecord({
    action,
    rowId
}: {
    action: (state: FormState, data: FormData) => Promise<FormState>,
    rowId: string
}) {
    const [state, formAction, isPending] = useActionState(action, { message: "" });

    useEffect(() => {
        if (state.message && !state.success) toast.error(state.message);
        if (state.success && state.message) toast.success(state.message);
    }, [state]);

    return (
        <form action={formAction}>
            <input type="hidden" name="rowId" value={rowId} />
            <Button type="submit" variant="destructive" disabled={isPending || !rowId}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
        </form>
    );
}
