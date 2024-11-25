const fs = require('fs-extra');
const path = require('path');

// Copy public files to root
async function deploy() {
    try {
        // Copy all files from public to root
        await fs.copy('./public', './');
        
        // Create images directory if it doesn't exist
        await fs.ensureDir('./images');
        await fs.ensureDir('./images/categories');
        
        // Create placeholder images if they don't exist
        const categories = ['pizza', 'burger', 'sushi', 'dessert'];
        for (const category of categories) {
            const imagePath = `./images/categories/${category}.jpg`;
            if (!await fs.pathExists(imagePath)) {
                // Create a text file as placeholder
                await fs.writeFile(imagePath, `Placeholder for ${category} image`);
            }
        }

        console.log('Deployment files copied successfully!');
    } catch (err) {
        console.error('Error during deployment:', err);
    }
}

deploy();
