import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const CANCELLATION_REASONS = [
  { value: "change-of-plans", label: "Change of Plans" },
  { value: "medical-emergency", label: "Medical Emergency" },
  { value: "flight-rescheduled", label: "Flight Rescheduled" },
  { value: "better-price", label: "Found Better Price" },
  { value: "personal-reasons", label: "Personal Reasons" },
  { value: "other", label: "Other" },
];

export default function CancellationDialog({
  open,
  onClose,
  booking,
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Preview, 2: Reason, 3: Processing
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [preview, setPreview] = useState(null);
  const [reason, setReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  useEffect(() => {
    if (open && booking) {
      loadPreview();
    } else {
      // Reset state when dialog closes
      setStep(1);
      setReason("");
      setAdditionalDetails("");
      setPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking]);

  async function loadPreview() {
    try {
      setLoading(true);
      const response = await api.get(
        `/bookings/${booking._id}/cancellation-preview`
      );
      setPreview(response.data);
    } catch (error) {
      toast.error("Failed to load cancellation preview");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!reason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    try {
      setCancelling(true);
      const reasonText =
        CANCELLATION_REASONS.find((r) => r.value === reason)?.label || reason;
      const fullReason = additionalDetails
        ? `${reasonText} - ${additionalDetails}`
        : reasonText;

      await api.post(`/bookings/${booking._id}/cancel`, {
        reason: fullReason,
      });

      toast.success("Booking cancelled successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  if (!booking) return null;

  const flight = booking.flightId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Cancel Booking" : "Cancellation Reason"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Review the cancellation details before proceeding"
              : "Please tell us why you're cancelling"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-sm text-muted-foreground">
              Loading cancellation details...
            </p>
          </div>
        ) : step === 1 ? (
          // Step 1: Preview
          <div className="space-y-4">
            {/* Booking Details */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <h4 className="font-semibold mb-2">Booking Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">PNR:</span>
                  <span className="ml-2 font-mono">{booking.pnr}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Flight:</span>
                  <span className="ml-2 font-medium">
                    {flight?.flightNumber}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Route:</span>
                  <span className="ml-2">
                    {flight?.source} → {flight?.destination}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Seat:</span>
                  <span className="ml-2">{booking.seatNumber}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            {preview?.canCancel ? (
              <>
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        Cancellation Policy
                      </h4>
                      <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                        <div className="flex items-center justify-between">
                          <span>Cancellation Tier:</span>
                          <Badge variant="outline" className="capitalize">
                            {typeof preview.tier === "object"
                              ? preview.tier.label
                              : preview.tier}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Cancellation Fee:</span>
                          <span className="font-semibold">
                            ₹{preview.cancellationFee?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Original Amount:</span>
                          <span>₹{booking.price?.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-yellow-500/30">
                          <span className="font-semibold">Refund Amount:</span>
                          <span className="font-bold text-lg">
                            ₹{preview.refundAmount?.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refund Timeline */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Refund Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Your refund will be processed within{" "}
                        <span className="font-medium">
                          {preview.refundProcessingDays || 7} business days
                        </span>{" "}
                        to your original payment method.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-lg border border-red-500/50 bg-red-50 dark:bg-red-950/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                        Important Notice
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        This action cannot be undone. Once cancelled, you will
                        need to make a new booking if you wish to travel.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-red-500/50 bg-red-50 dark:bg-red-950/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Cannot Cancel
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {preview?.reason ||
                        "This booking cannot be cancelled at this time."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Step 2: Reason
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Your feedback helps us improve our service. Thank you for
                sharing.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={cancelling}>
            {step === 1 ? "Keep Booking" : "Back"}
          </Button>
          {preview?.canCancel && (
            <Button
              variant={step === 1 ? "destructive" : "default"}
              onClick={() => {
                if (step === 1) {
                  setStep(2);
                } else {
                  handleCancel();
                }
              }}
              disabled={cancelling || (step === 2 && !reason)}
            >
              {cancelling
                ? "Processing..."
                : step === 1
                ? "Proceed to Cancel"
                : "Confirm Cancellation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
