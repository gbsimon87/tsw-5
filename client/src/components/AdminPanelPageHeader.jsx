import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

function AdminPanelPageHeader({
  backButtonLink,
  backButtonText = 'Back',
  pageTitle,
  subHeader,
  tabs = [],
  activeTab,
  onTabChange
}) {
  const navigate = useNavigate();

  return (
    <header className="flex flex-col mb-8 gap-4">
      <div className="flex justify-between gap-3 flex-wrap sm:flex-nowrap">
        {backButtonLink ? (
          <button
            onClick={() => navigate(backButtonLink)}
            className="flex items-center gap-2 bg-white text-blue-700 border border-blue-600 px-4 py-1.5 rounded-lg font-semibold shadow hover:bg-blue-50 transition focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label={backButtonText}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            {backButtonText}
          </button>
        ) : (
          <div></div>
        )}

        <div className="text-left sm:text-right">
          <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
          {subHeader && (
            <div className="text-sm text-gray-500 font-normal">{subHeader}</div>
          )}
        </div>

      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon, onClick, alwaysActive }) => (
          <button
            key={id}
            type="button"
            onClick={onClick ? onClick : () => onTabChange(id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold transition focus:ring-2 focus:ring-blue-500 focus:outline-none ${alwaysActive || activeTab === id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-700 border border-blue-600 hover:bg-blue-50'
              }`}
            aria-label={label}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

export default AdminPanelPageHeader;
