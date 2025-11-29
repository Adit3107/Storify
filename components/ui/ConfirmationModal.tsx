import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "danger" | "warning" | "success" | "default";
  onConfirm: () => void;
  isDangerous?: boolean;
  warningMessage?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconColor = "text-destructive",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "danger",
  onConfirm,
  isDangerous = false,
  warningMessage,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isDangerous && warningMessage && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4 border border-destructive/20">
              <div className="flex items-start gap-3">
                {Icon && (
                  <Icon
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`}
                  />
                )}
                <div>
                  <p className="font-medium">This action cannot be undone</p>
                  <p className="text-sm mt-1">{warningMessage}</p>
                </div>
              </div>
            </div>
          )}
          <DialogDescription className="text-foreground">
            {description}
          </DialogDescription>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmColor === "danger" ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {Icon && <Icon className="h-4 w-4 mr-2" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
