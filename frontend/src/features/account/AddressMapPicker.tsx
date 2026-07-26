import { useEffect, useRef, useState } from 'react';
import L, { type CircleMarker, type Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import { environment } from '../../config/environment';
import { type MapAddressSelection, type MapPoint, reverseGeocode } from './addressMap';

const ULAANBAATAR: MapPoint = {
  latitude: 47.918873,
  longitude: 106.917701,
};

interface AddressMapPickerProps {
  onClose(): void;
  onSelect(selection: MapAddressSelection): void;
}

export function AddressMapPicker({ onClose, onSelect }: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestInProgressRef = useRef(false);
  const lastRequestAtRef = useRef(0);
  const [point, setPoint] = useState<MapPoint>(ULAANBAATAR);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const center: L.LatLngExpression = [ULAANBAATAR.latitude, ULAANBAATAR.longitude];
    const map: LeafletMap = L.map(container, { zoomControl: true }).setView(center, 13);
    L.tileLayer(environment.mapTileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    const marker: CircleMarker = L.circleMarker(center, {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#dc2626',
      fillOpacity: 1,
    }).addTo(map);

    function syncPoint() {
      const next = map.getCenter();
      marker.setLatLng(next);
      setPoint({ latitude: next.lat, longitude: next.lng });
    }
    function chooseClickedPoint(event: L.LeafletMouseEvent) {
      map.panTo(event.latlng);
    }

    map.on('moveend', syncPoint);
    map.on('click', chooseClickedPoint);
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(resizeTimer);
      map.off('moveend', syncPoint);
      map.off('click', chooseClickedPoint);
      map.remove();
    };
  }, []);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    []
  );

  async function selectPoint() {
    const now = Date.now();
    if (requestInProgressRef.current || now - lastRequestAtRef.current < 1_000) return;
    requestInProgressRef.current = true;
    lastRequestAtRef.current = now;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('loading');
    setError('');
    try {
      const selection = await reverseGeocode(point, controller.signal);
      onSelect(selection);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : 'Хаяг тодорхойлж чадсангүй.');
      setStatus('error');
    } finally {
      requestInProgressRef.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Газрын зураг хаах"
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-map-title"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="address-map-title" className="text-lg font-bold text-neutral-900">
              Хаягаа газрын зураг дээр сонгоно уу
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Газрын зургийг хөдөлгөх эсвэл хүссэн цэг дээр дараад улаан тэмдэглэгээг байрлуулна.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Газрын зураг хаах"
          >
            <X size={20} />
          </button>
        </header>

        <div
          ref={mapContainerRef}
          className="h-[min(62vh,34rem)] min-h-80 w-full bg-neutral-100"
          aria-label="Улаанбаатар хотын газрын зураг"
        />

        <footer className="border-t border-neutral-200 bg-white px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">
              {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Хаягийг OpenStreetMap мэдээллээс нэг удаа тодорхойлно. Хадгалахаасаа өмнө шалгана уу.
            </p>
            {error ? (
              <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex shrink-0 gap-3 sm:mt-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Болих
            </button>
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={() => void selectPoint()}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'loading' ? 'Хаяг тодорхойлж байна…' : 'Энэ байршлыг сонгох'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
