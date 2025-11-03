import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Package,
  Scale,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getBaggageByBooking } from "@/lib/baggage";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import LoadingFallback from "@/components/LoadingFallback";

export default function BaggageSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [baggageInfo, setBaggageInfo] = useState(null);

  useDocumentTitle("Baggage Information");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getBaggageByBooking(id);
      setBaggageInfo(data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load baggage information"
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    toast.success("Baggage allowance confirmed!");
    const from = location.state?.from;
    if (from === "booking") {
      navigate(`/passenger-details/${id}`, { state: { from: "booking" } });
    } else if (from === "checkin") {
      navigate(`/check-in/${id}`);
    } else {
      navigate("/account");
    }
  }

  if (loading) {
    return <LoadingFallback />;
  }

  if (!baggageInfo) {
    return null;
  }

  const { allowance, travelClass, summary } = baggageInfo;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Baggage Allowance</h1>
          </div>
          <p className="text-muted-foreground mb-2">
            Your baggage allowance for this flight
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium mb-8">
            <Check className="h-4 w-4" />
            Included in your fare - No additional charges
          </div>

          {/* Travel Class Badge */}
          <div className="mb-6">
            <Badge variant="secondary" className="text-sm capitalize">
              {travelClass} Class
            </Badge>
          </div>

          {/* Cabin Baggage */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Cabin Baggage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pieces</p>
                    <p className="font-semibold">
                      {allowance.cabinBaggage.pieces}{" "}
                      {allowance.cabinBaggage.pieces === 1 ? "bag" : "bags"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Scale className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Max Weight</p>
                    <p className="font-semibold">
                      {allowance.cabinBaggage.maxWeight} kg
                      {allowance.cabinBaggage.pieces > 1 && " each"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Ruler className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-semibold text-sm">
                      {allowance.cabinBaggage.maxDimensions}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {allowance.cabinBaggage.description}
              </p>
            </CardContent>
          </Card>

          {/* Checked Baggage */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Checked Baggage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pieces</p>
                    <p className="font-semibold">
                      {allowance.checkedBaggage.pieces}{" "}
                      {allowance.checkedBaggage.pieces === 1 ? "bag" : "bags"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Scale className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Max Weight</p>
                    <p className="font-semibold">
                      {allowance.checkedBaggage.maxWeight} kg each
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {allowance.checkedBaggage.totalWeight} kg
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                  <Ruler className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-semibold text-sm">
                      {allowance.checkedBaggage.maxDimensions}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {allowance.checkedBaggage.description}
              </p>
            </CardContent>
          </Card>

          {/* Personal Item */}
          {allowance.personalItem && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Personal Item Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {allowance.personalItem.description}
                </p>
                <p className="text-sm font-medium">
                  Max Dimensions: {allowance.personalItem.maxDimensions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Priority Benefits */}
          {allowance.priority && (
            <Card className="mb-6 border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Check className="h-5 w-5" />
                  Priority Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {allowance.priority.priorityBoarding && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Priority Boarding
                    </li>
                  )}
                  {allowance.priority.priorityBaggage && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Priority Baggage Handling
                    </li>
                  )}
                  {allowance.priority.fastTrackSecurity && (
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600" />
                      Fast-Track Security
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Baggage exceeding the allowed weight/dimensions may incur
                additional charges
              </p>
              <p>
                • Prohibited items include sharp objects, flammable materials,
                and explosives
              </p>
              <p>
                • Liquids in cabin baggage must be in containers of 100ml or
                less
              </p>
              <p>• All baggage is subject to security screening</p>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
