import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getAllAirports,
  getPopularAirports,
  formatAirport,
} from "@/lib/airports";

export function AirportSelector({
  value,
  onValueChange,
  placeholder = "Select airport",
}) {
  const [open, setOpen] = useState(false);
  const [airports, setAirports] = useState([]);
  const [popularAirports, setPopularAirports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && airports.length === 0) {
      loadAirports();
    }
  }, [open]);

  const loadAirports = async () => {
    try {
      setLoading(true);
      const [all, popular] = await Promise.all([
        getAllAirports(),
        getPopularAirports(),
      ]);
      setAirports(all);
      setPopularAirports(popular);
    } catch (error) {
      console.error("Failed to load airports:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAirport = useMemo(() => {
    if (!value) return null;
    return airports.find((airport) => formatAirport(airport) === value);
  }, [value, airports]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-2xl"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-[400px] p-0 rounded-2xl"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search by city, code, or airport name..." />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">
                Loading airports...
              </div>
            ) : airports.length === 0 ? (
              <CommandEmpty>No airports available.</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No airport found.</CommandEmpty>

                {popularAirports.length > 0 && (
                  <CommandGroup heading="Popular">
                    {popularAirports.map((airport) => {
                      const airportValue = formatAirport(airport);
                      return (
                        <CommandItem
                          key={`popular-${airport.code}`}
                          value={airportValue}
                          onSelect={() => {
                            onValueChange(airportValue);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === airportValue
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <Plane className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {airport.city} ({airport.code})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {airport.name}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                <CommandGroup heading="All Airports">
                  {airports.map((airport) => {
                    const airportValue = formatAirport(airport);
                    return (
                      <CommandItem
                        key={airport.code}
                        value={`${airport.city} ${airport.code} ${airport.name} ${airport.state}`}
                        onSelect={() => {
                          onValueChange(airportValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === airportValue ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Plane className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {airport.city} ({airport.code})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {airport.name}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
