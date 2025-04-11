# CS:GO Case Simulator

This is a CS:GO case simulator integrated into the Nooter's Farm project. It's adapted from a standalone Vite project and converted to work within the Next.js application.

## Features

- View and open different CS:GO cases
- Animated case opening experience with roulette
- Shop to purchase more virtual currency
- User inventory to track opened items
- Responsive design that works on mobile and desktop

## Structure

- `/app/case-simulator`: Main page for the case simulator
- `/app/case-simulator/open/[caseId]`: Dynamic route for opening specific cases
- `/components/case-simulator`: Main component files
  - `index.tsx`: Main component for the simulator
  - `case-opening.tsx`: Component for the case opening experience
  - `styles.module.css`: Styles for the case simulator components

## Original Attribution

This component was based on a Vite.js project located at:
```
C:\Users\PC\Desktop\Nooters Farm\csgo like case simulator\vitejs-csgo-case-simulator
```

The original project was adapted and integrated into the current Next.js framework, with components restructured to fit the existing application architecture.

## Future Improvements

- Add more cases and items
- Implement backend storage for user inventory
- Add sound effects for a more immersive experience
- Create proper images for all items and cases 