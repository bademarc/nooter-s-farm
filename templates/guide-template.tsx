// Guide Template for Other Sections
// Copy and adapt this template for each game section that needs a guide

// 1. Import at the top of your component file
import { useGuides } from '../hooks/useGuides';
import GuideModal from '../components/GuideModal';

// 2. Add inside your component's function body
// Replace 'sectionName' with the actual section name (market, animals, etc.)
const { shouldShowGuide, markGuideAsViewed, isNootPro } = useGuides();
const [showGuide, setShowGuide] = useState(false);

useEffect(() => {
  // Check if guide should be shown on component mount
  if (shouldShowGuide('sectionName')) {
    setShowGuide(true);
  }
}, [shouldShowGuide]);

const handleCloseGuide = () => {
  setShowGuide(false);
  markGuideAsViewed('sectionName');
};

// 3. Add inside your JSX return, typically at the end before the closing tag
{showGuide && (
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
    onClose={handleCloseGuide}
    isNootPro={isNootPro}
  />
)}

// Notes:
// 1. Make sure to have a corresponding image at the specified path
// 2. Customize the content for each section
// 3. Update the section name in useGuides.tsx if adding a new section type 