# SKU Checker - Shopee and Lazada

## How to use:

### 1. Importing Shopee Products
- Remove top 2 rows from generated Excel sheet before importing

### 2. Importing Product List
- Use the following fields: sku, product name, category name

## Getting Started

### Dependencies

#### 1. NodeJS v24 or higher
Download here: [https://nodejs.org/en/download](https://nodejs.org/en/download)

[Note] In the installer, make sure to click check on:
```
[] Automatically install the necessary tools
```

NodeJS Installation Tutorial:
[https://www.youtube.com/watch?v=7pbQ4ZKPBiU](https://www.youtube.com/watch?v=7pbQ4ZKPBiU)

#### 2. MySQL Server and Workbench
Download here: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)

How to Access Railway MySQL Connection: [https://www.youtube.com/watch?v=ALKyFmiFH_4](https://www.youtube.com/watch?v=ALKyFmiFH_4)

### Installation

#### 1. Download ZIP of main branch on GitHub
* Extract to desired folder (ex: C:\Users\Me\Downloads)
* On command prompt, change directory to the path of the project folder. Example command below:
```
cd Downloads/My_Folder
``` 

#### 2. npm init -y
* Use the package manager [npm] to initialize the folder as a NodeJS project.

```
npm init -y
```

#### 3. Install Node Libraries
* Use [npm] to install the required Node libraries
```
npm install express dotenv hbs path express-fileupload express-session cookie-parser mysql2
```

##### Optional: Install repomix for converting repository into an XML file
1. Go to your repo folder where you are at the root.
2. Type cmd at the top to open cmd at the root already

```
npm install -g repomix
```

3. Then in your command line, enter the following to convert the repository into an xml file
```
repomix
```