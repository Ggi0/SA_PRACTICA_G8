import { MapPin } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCities } from '@/hooks/useMovieData'
import { useCheckoutStore } from '@/context/checkoutStore'

export function CitySelector() {
  const { data: cities = [], isLoading } = useCities()
  const { selectedCity, setCity } = useCheckoutStore()

  return (
    <div className="flex items-center gap-1.5">
      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value={selectedCity ?? undefined}
        onValueChange={setCity}
        disabled={isLoading}
      >
        <SelectTrigger className="h-8 w-48 border-0 bg-transparent text-sm font-medium shadow-none focus:ring-0">
          <SelectValue placeholder="Selecciona tu ciudad" />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}