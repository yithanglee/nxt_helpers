import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  searchQueries: string[];
  oriSearchQuery: Record<string, string>;
  onSearch: (query: Record<string, string>) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ searchQueries,oriSearchQuery, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {

    setSearchQuery(prevQuery => ({ ...prevQuery, [key]: value }));
  };

  const handleSearch = () => {

    onSearch(searchQuery);
  };

  return (
    <div className="flex space-x-2">
      {searchQueries.length > 0 &&
        searchQueries.map((sQuery) =>
          sQuery.split('|').map((singleQuery) => {
      
            if (!singleQuery.includes('=')) {
              return (
                <Input
                  key={singleQuery}
                  placeholder={singleQuery.split('.')[1] + ': ' +  (oriSearchQuery[singleQuery] || '') }
                  value={searchQuery[singleQuery] || ''}
                  onChange={(e) => handleInputChange(singleQuery, e.target.value)}
                />
              );
            }
            return null;
          })
        )}
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
};

export default SearchInput;
