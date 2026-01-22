import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { getRewardBalance } from "@/lib/rewards";
import { Gift, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function RewardsTab() {
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const data = await getRewardBalance();
      setRewardsData(data);
      setTransactions(data.recentTransactions || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't load your rewards.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((txn) => txn.type === filter);
  }, [transactions, filter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading rewards...</p>
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <Card className="overflow-hidden border-0 rounded-4xl sm:rounded-4xl bg-primary">
            <div className="p-6 sm:p-8 text-secondary">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <p className="text-secondary/80 text-sm sm:text-base">
                  Available Balance
                </p>
              </div>
              <p className="text-4xl sm:text-5xl font-bold mb-4 sm:mb-6">
                {rewardsData?.balance?.toLocaleString() || 0}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <p className="text-secondary/60 text-xs sm:text-sm mb-1">
                    Total Earned
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {rewardsData?.totalEarned?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-secondary/60 text-xs sm:text-sm mb-1">
                    Total Redeemed
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {rewardsData?.totalRedeemed?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-secondary/60 text-xs sm:text-sm mb-1">
                    Transactions
                  </p>
                  <p className="text-lg sm:text-xl font-semibold">
                    {rewardsData?.transactionCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "earn", "redeem"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* Transactions */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <Card className="p-12 text-center rounded-3xl">
                <Gift className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
              </Card>
            ) : (
              filteredTransactions.map((txn) => (
                <motion.div
                  key={txn._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="rounded-2xl sm:rounded-3xl">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              txn.type === "earn"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {txn.type === "earn" ? (
                              <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            ) : (
                              <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base truncate">
                              {txn.description ||
                                (txn.type === "earn"
                                  ? "Points Earned"
                                  : "Points Redeemed")}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {formatDate(txn.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`text-lg sm:text-xl font-bold flex-shrink-0 ${
                            txn.type === "earn"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {txn.type === "earn" ? "+" : "-"}
                          {txn.points}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
