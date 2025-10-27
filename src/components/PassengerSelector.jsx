import { useState } from "react";
import { Users, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function PassengerSelector({
  value = { adults: 1, children: 0 },
  onValueChange,
}) {
  const [open, setOpen] = useState(false);

  const handleIncrement = (type) => {
    onValueChange({
      ...value,
      [type]: value[type] + 1,
    });
  };

  const handleDecrement = (type) => {
    if (type === "adults" && value.adults <= 1) return;
    if (type === "children" && value.children <= 0) return;

    onValueChange({
      ...value,
      [type]: value[type] - 1,
    });
  };

  const displayText = `${value.adults} Adult${value.adults > 1 ? "s" : ""}, ${
    value.children
  } Child${value.children !== 1 ? "ren" : ""}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-2xl"
        >
          {displayText}
          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] rounded-2xl" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Passengers</h4>
            <p className="text-xs text-muted-foreground">
              Select the number of travelers
            </p>
          </div>

          {/* Adults */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Adults</p>
              <p className="text-xs text-muted-foreground">12+ years</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleDecrement("adults")}
                disabled={value.adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {value.adults}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleIncrement("adults")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Children</p>
              <p className="text-xs text-muted-foreground">0-11 years</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleDecrement("children")}
                disabled={value.children <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {value.children}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => handleIncrement("children")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full rounded-full"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
