function loadDataFromURL(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    header: true,
                    dynamicTyping: true,
                    complete: function(results) {
                        resolve(results.data);
                    }
                });
            })
            .catch(error => reject(error));
    });
}

function processData() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) {
        alert('Por favor, selecciona el archivo \"MyEBirdData.csv\" primero.');
        return;
    }

    const ebirdFile = fileInput.files[0];

    // Load species.csv from given URL
    loadDataFromURL('assets/csv/species.csv').then(speciesData => {
        // Parse the eBird CSV
        Papa.parse(ebirdFile, {
            header: true,
            dynamicTyping: true,
            complete: function(ebirdResults) {
                const sortedData = generateSortedSpecies(ebirdResults.data, speciesData);
                displayDataInTable(sortedData);
            }
        });
    }).catch(error => {
        console.error('Error loading species.csv:', error);
        alert('There was an error loading species.csv.');
    });
}

function generateSortedSpecies(ebirdData, speciesData) {
    // Filter ebirdData based on "State/Province" of "ES-GA"
    const filteredEbirdData = ebirdData.filter(row => row["State/Province"] === "ES-GA");

    // Sum the total count for each species
    const speciesCounts = {};
    filteredEbirdData.forEach(row => {
        if (speciesCounts[row["Scientific Name"]]) {
            speciesCounts[row["Scientific Name"]] += row["Count"];
        } else {
            speciesCounts[row["Scientific Name"]] = row["Count"];
        }
    });

    // Merge speciesCounts with speciesData
    const mergedData = speciesData.map(species => {
        return {
            ...species,
            Count: speciesCounts[species.scientificName] || 0
        };
    }).filter(row => row.Count > 0); // Only include species with counts

    // Sort by numObservations
    mergedData.sort((a, b) => a.numObservations - b.numObservations);

    return mergedData;
}

function displayDataInTable(data) {
    const table = document.getElementById('resultsTable');
    const tbody = table.querySelector('tbody');

    // Clear previous data
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        
        // Add each cell to the row
        ['commonName_es', 'scientificName', 'numObservations', 'Count'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = row[key];
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    // Show the table
    table.hidden = false;
}
