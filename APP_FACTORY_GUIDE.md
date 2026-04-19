# 🏭 App Factory Documentation & Developer Guide

Benvenuto nel cuore della tua **App Factory**. Questo framework è stato progettato per permetterti di lanciare nuove applicazioni in minuti, non ore, semplicemente configurando i parametri giusti e aggiungendo i moduli necessari.

---

## 🏗️ L'Architettura: "Screaming Factory"

L'app non è divisa per "tipo di file" (Componenti, Pagine, Hook), ma per **Funzionalità (Features)**. Questo si chiama *Screaming Architecture*: guardando la cartella `src/features`, l'architettura "urla" cosa fa l'applicazione.

### Struttura di una Feature
Ogni feature in `src/features/[name]` è autonoma e contiene:
- **`components/`**: UI specifica per la feature.
- **`hooks/`**: Logica headless specifica.
- **`Page.tsx`**: Il punto di ingresso della vista.

---

## ⚙️ 1. Configurazione Centrale (`APP_CONFIG`)

Tutto il comportamento dell'app è pilotato dal file:
📍 `src/config/app.config.ts`

### Abilitare/Disabilitare Funzionalità
Per aggiungere o rimuovere un'intero modulo (es. Mappe o Chat), modifica l'oggetto `features`:

```typescript
export const APP_CONFIG = {
  features: {
    hasMaps: true,          // Abilita la pagina mappe e le rotte relative
    hasChat: false,         // Rimuove la chat e le notifiche di messaggi
    hasAuth: true,          // Abilita il login (se false, l'app è pubblica)
    // ...
  }
}
```

**Cosa succede automaticamente?**
- Le rotte in `App.tsx` vengono rimosse/aggiunte.
- Le icone nella `BottomNav` spariscono/appaiono.
- La `Header` nasconde/mostra i pulsanti relativi.

---

## 🎨 2. Personalizzazione Grafica (Design Tokens)

Non modificare le classi Tailwind ovunque. Usa i **Design Tokens**.

### Colori e Branding
In `src/index.css` troverai le variabili CSS principali:
- `--color-primary-500`: Il colore "firma" della tua app.
- `--radius-card`: La rotondità degli elementi.
- `--font-main`: Il font globale.

### Palette Dinamiche
Lo store `useThemeStore.ts` permette di cambiare la palette HSL a runtime. Gli amministratori possono cambiare il colore primario che verrà iniettato come variabile CSS in tutto il DOM.

---

## 🚀 3. Creare una Nuova Funzionalità

Per aggiungere, ad esempio, un modulo "Eventi":

1.  **Crea la cartella**: `src/features/events/EventsPage.tsx`.
2.  **Configura il Toggle**: Aggiungi `hasEvents: true` in `app.config.ts`.
3.  **Aggiungi la Rotta**: In `App.tsx`, importa la pagina e aggiungi la rotta condizionale:
    ```tsx
    {APP_CONFIG.features.hasEvents && (
      <Route path="/events" element={<EventsPage />} />
    )}
    ```
4.  **Aggiungi il Nav**: In `src/features/navigation/BottomNav.tsx`, aggiungi l'icona e il link.

---

## 🔌 4. Layer dei Servizi (Repository Pattern)

Non importare mai `firestore` o `firebase/auth` direttamente nei tuoi componenti. Usa i servizi astratti:

- **`dbService`**: Per operazioni CRUD su Firestore (`getDocument`, `addDocument`, etc.).
- **`authService`**: Per login, logout e gestione profilo.

*Vantaggio: Se domani vuoi passare a Supabase o un altro backend, cambi solo il contenuto dei file in `src/services/` senza toccare la UI.*

---

## 🧩 5. Componenti Standard

Usa sempre i componenti in `src/components/ui/` per garantire coerenza:
- **`<Icon name="Add" />`**: Usa nomi semantici (Home, Search, Profile) invece di importare icone grezze.
- **`<GlassCard />`**: Per il look moderno "vetroso" standard della factory.
- **`<Button />`**: Gestisce già stati di caricamento e varianti.

---

## 🧪 6. Check-list per una nuova App

Quando cloni questa boilerplate per un nuovo progetto:
1. [ ] Cambia `appName` e `appIcon` in `app.config.ts`.
2. [ ] Aggiorna le credenziali Firebase in `.env`.
3. [ ] Definisci il colore primario in `index.css`.
4. [ ] Spegni le feature (`hasMaps`, `hasChat`, etc.) che non servono.
5. [ ] Configura le lingue supportate in `app.config.ts`.

---

## ⚠️ Note Tecniche Importanti

- **Zustand Reset**: Se aggiungi uno store (es. `useEventStore`), ricordati di aggiungere il suo reset in `src/store/resetStores.ts` per garantire un logout pulito.
- **Animazioni**: Usa le costanti `PAGE_VARIANTS` e `TRANSITIONS` da `src/constants/animations.ts` per mantenere lo stesso "Animation Signature" in tutta l'app.
