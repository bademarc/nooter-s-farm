// Guide Template for Other Sections (Tab-based)
// Copy and adapt this template for each game section that needs a guide

// 1. Import at the top of your component file
import { useGuideContext } from '../context/guide-context';
import GuideModal from '../components/GuideModal';

// 2. Add state variables to your component
// Replace 'sectionName' with the actual section name (market, animals, etc.)
const { shouldShowGuide, markGuideAsViewed, isNootPro } = useGuideContext();
const [showSectionGuide, setShowSectionGuide] = useState(false);

// 3. Add useEffect to check when the tab becomes active
useEffect(() => {
  // This will trigger when the activeTab changes to this section
  if (activeTab === "sectionName" && shouldShowGuide('sectionName')) {
    setShowSectionGuide(true);
  }
}, [activeTab, shouldShowGuide]);

// 4. Add handler to close the guide
const handleCloseSectionGuide = () => {
  setShowSectionGuide(false);
  markGuideAsViewed('sectionName');
};

// 5. Add the guide modal to your JSX return, typically at the end before the closing tag
{showSectionGuide && (
  <GuideModal
    imagePath="/images/guide/sectionName.jpg"
    title="Welcome to Section Name!"
    content={
      <div>
        <p className="mb-4">Main description text goes here.</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Step 1:</strong> Description of first step.</li>
          <li><strong>Step 2:</strong> Description of second step.</li>
          <li><strong>Step 3:</strong> Description of third step.</li>
          {/* Add more steps as needed */}
        </ol>
      </div>
    }
    onClose={handleCloseSectionGuide}
    isNootPro={isNootPro}
  />
)}

// Notes:
// 1. Make sure to have a corresponding image at the specified path (/images/guide/sectionName.jpg)
// 2. Customize the content for each section
// 3. Make sure 'sectionName' is listed in the GuideSection type in useGuides.tsx
// 4. The activeTab variable should be available in your component 