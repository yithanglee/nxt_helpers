import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { join } from 'path';

interface SearchInputProps {
  model?: string;
  join_statements?: Record<any, any>;
  searchQueries: string[];
  oriSearchQuery: Record<string, string>;
  onSearch: (query: Record<string, string>) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({model, join_statements, searchQueries,oriSearchQuery, onSearch }) => {
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
              function placeholderName(): string | undefined {


                console.log(model)

                console.log(join_statements)

                if (join_statements == undefined){
                  return ''
                }

                let dict: Record<any,any> = {}, dictKeys  = ['b','c','d', 'e', 'f'], head = ''
                dict['a'] = model 

                try {
                  if (join_statements!.length > 0){

                    for (let index = 0; index < join_statements!.length; index++) {
                      const element = join_statements![index];
                      dict[dictKeys[index]] = Object.keys(join_statements![index])[0]
                      
                    }

               
                  }
                  head = dict[singleQuery.split('.')[0]].replace("_", " ");
             
                }catch(e){

                  console.error(e)

                }
                

               return head + '\s ' +  singleQuery.split('.')[1] + ': ' +  (oriSearchQuery[singleQuery] || '')
              }

              return (
                <Input
                  key={singleQuery}
                  placeholder={placeholderName() }
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
