/**
 * csv.js
 * Handles the "Import CSV" dropdown, client-side CSV parsing/preview,
 * and submitting the parsed rows to the matching backend import endpoint.
 *
 * Expects csv.html's markup (addUserDropdown, csvUploadInput, csvConfirmModal, etc).
 */

(function () {
    "use strict";

    // ---------------------------------------------------------------------
    // Config: which CSV type maps to which endpoint + which columns we expect
    // ---------------------------------------------------------------------

    // normalizeHeader turns "Item Name", "item_name", " ITEM  NAME " etc
    // into the same key: "item name"
    function normalizeHeader(h) {
        return String(h || "")
            .trim()
            .toLowerCase()
            .replace(/[_]+/g, " ")
            .replace(/\s+/g, " ");
    }

    // Each entry: dbField -> list of acceptable (normalized) CSV header aliases
    const IMPORT_CONFIGS = {
        "my-products": {
            endpoint: "/import/my-products",
            label: "My Products",
            fields: {
                sku: ["sku"],
                product_name: ["item name", "product name", "name"],
                category_name: ["category name", "category"]
            },
            required: ["sku"]
        },
        "lazada": {
            endpoint: "/import/lazada",
            label: "Lazada",
            fields: {
                product_id: ["product id", "productid", "itemid", "item id"],
                catId: ["catid", "category id", "cat id"],
                product_name: ["product name"],
                currency: ["currencyCode", "currency"],
                sku_id: ["sku.skuId" , "sku id"],
                status: ["status"],
                shop_sku: ["shopsku", "shop sku"],
                seller_sku: ["sellersku", "seller sku"],
                quantity: ["quantity", "stock", "qty"],
                special_price: ["special price", "SpecialPrice"],
                special_price_start: ["special price start"],
                special_price_end: ["special price end"],
                price: ["price"],
                variations_combo: ["Variations Combo"],
                tr: ["tr", "tr(s-wb-product@md5key)"]
            },
            required: ["product_id"]
        },
        "shopee": {
            endpoint: "/import/shopee",
            label: "Shopee",
            fields: {
                product_id: ["product id", "productid"],
                product_name: ["product name", "name"],
                variation_id: ["variation id"],
                variation_name: ["variation name"],
                parent_sku: ["parent sku"],
                sku: ["sku"],
                price: ["price"],
                gtin: ["gtin"],
                stock: ["stock"],
                fail_reason: ["fail reason", "reason"]
            },
            required: ["product_id"]
        }
    };

    // Map the dropdown option's visible label -> import type key.
    // (Matched by text content since the HTML doesn't tag each option distinctly.)
    function importTypeFromLabel(text) {
        const t = text.toLowerCase();
        if (t.includes("my products")) return "my-products";
        if (t.includes("lazada")) return "lazada";
        if (t.includes("shopee")) return "shopee";
        return null;
    }

    // ---------------------------------------------------------------------
    // CSV parsing (handles quoted fields, commas/newlines inside quotes)
    // ---------------------------------------------------------------------
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = "";
        let inQuotes = false;

        // Normalize line endings
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (inQuotes) {
                if (char === '"') {
                    if (text[i + 1] === '"') {
                        field += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                row.push(field);
                field = "";
            } else if (char === "\n") {
                row.push(field);
                rows.push(row);
                row = [];
                field = "";
            } else {
                field += char;
            }
        }

        // Last field/row (if file doesn't end with a newline)
        if (field.length > 0 || row.length > 0) {
            row.push(field);
            rows.push(row);
        }

        // Drop fully-empty trailing rows
        return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
    }

    function rowsToObjects(rows, config) {
        if (rows.length === 0) return { objects: [], skippedHeaderOnly: true };

        const headerRow = rows[0].map(normalizeHeader);

        // For each expected db field, find which CSV column index matches it
        const fieldToIndex = {};
        Object.keys(config.fields).forEach((dbField) => {
            const aliases = config.fields[dbField];
            const idx = headerRow.findIndex((h) => aliases.includes(h));
            if (idx !== -1) fieldToIndex[dbField] = idx;
        });

        const objects = [];
        for (let r = 1; r < rows.length; r++) {
            const csvRow = rows[r];
            const obj = {};
            Object.keys(config.fields).forEach((dbField) => {
                const idx = fieldToIndex[dbField];
                obj[dbField] = idx !== undefined ? (csvRow[idx] ?? "").trim() : "";
            });
            objects.push(obj);
        }

        return { objects, fieldToIndex, headerRow };
    }

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------
    let pendingImportType = null; // "my-products" | "lazada" | "shopee"
    let pendingRows = [];         // parsed + mapped row objects awaiting confirm

    // ---------------------------------------------------------------------
    // DOM wiring
    // ---------------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", () => {
        const filterBtn = document.getElementById("filterBtn");
        const filterDropdown = document.getElementById("filterDropdown");
        const addUserBtn = document.getElementById("addUserBtn");
        const addUserDropdown = document.getElementById("addUserDropdown");
        const csvUploadInput = document.getElementById("csvUploadInput");

        const csvConfirmModal = document.getElementById("csvConfirmModal");
        const modalCloseBtn = document.getElementById("modalCloseBtn");
        const uploadCountEl = document.getElementById("uploadCount");
        const previewTable = document.getElementById("previewTable");
        const confirmUploadBtn = document.getElementById("confirmUploadBtn");
        const cancelUploadBtn = document.getElementById("cancelUploadBtn");

        // --- Filter dropdown toggle ---
        if (filterBtn && filterDropdown) {
            filterBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeDropdown(addUserDropdown);
                toggleDropdown(filterDropdown);
            });

            filterDropdown.querySelectorAll(".filter-option").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const filter = btn.dataset.filter;
                    filterBtn.textContent = `Filter: ${capitalize(filter)}`;
                    closeDropdown(filterDropdown);
                    // Hook point: re-fetch / re-render table filtered by status here.
                });
            });
        }

        // --- Import CSV dropdown toggle ---
        if (addUserBtn && addUserDropdown) {
            addUserBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeDropdown(filterDropdown);
                toggleDropdown(addUserDropdown);
            });

            addUserDropdown.querySelectorAll(".add-user-option").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const importType = importTypeFromLabel(btn.textContent);
                    if (!importType) {
                        alert("Unknown import option.");
                        return;
                    }
                    pendingImportType = importType;
                    closeDropdown(addUserDropdown);
                    csvUploadInput.value = ""; // allow re-selecting the same file
                    csvUploadInput.click();
                });
            });
        }

        // Close open dropdowns when clicking elsewhere on the page
        document.addEventListener("click", () => {
            closeDropdown(filterDropdown);
            closeDropdown(addUserDropdown);
        });

        // --- File selected -> parse + preview ---
        if (csvUploadInput) {
            csvUploadInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        handleParsedFile(evt.target.result);
                    } catch (err) {
                        console.error(err);
                        alert("Could not parse that CSV file. Please check its formatting.");
                    }
                };
                reader.onerror = () => alert("Failed to read the file.");
                reader.readAsText(file);
            });
        }

        function handleParsedFile(text) {
            const config = IMPORT_CONFIGS[pendingImportType];
            if (!config) return;

            const rawRows = parseCSV(text);
            const { objects } = rowsToObjects(rawRows, config);

            // Filter out rows missing required fields
            const validRows = objects.filter((obj) =>
                config.required.every((f) => obj[f] && obj[f] !== "")
            );
            const skippedCount = objects.length - validRows.length;

            pendingRows = validRows;

            renderPreview(config, validRows, skippedCount);
            openModal(csvConfirmModal);
        }

        function renderPreview(config, rows, skippedCount) {
            uploadCountEl.textContent =
                `${config.label}: ${rows.length} row(s) ready to import` +
                (skippedCount > 0 ? ` (${skippedCount} skipped - missing required field(s))` : "");

            const columns = Object.keys(config.fields);
            const previewRows = rows.slice(0, 15); // don't render thousands of rows

            let html = "<thead><tr>" +
                columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("") +
                "</tr></thead><tbody>";

            previewRows.forEach((row) => {
                html += "<tr>" + columns.map((c) => `<td>${escapeHtml(row[c] || "")}</td>`).join("") + "</tr>";
            });

            if (rows.length > previewRows.length) {
                html += `<tr><td colspan="${columns.length}">…and ${rows.length - previewRows.length} more row(s)</td></tr>`;
            }

            html += "</tbody>";
            previewTable.innerHTML = html;
        }

        // --- Confirm upload ---
        if (confirmUploadBtn) {
            confirmUploadBtn.addEventListener("click", async () => {
                const config = IMPORT_CONFIGS[pendingImportType];
                if (!config || pendingRows.length === 0) {
                    closeModal(csvConfirmModal);
                    return;
                }

                confirmUploadBtn.disabled = true;
                confirmUploadBtn.textContent = "Importing…";

                try {
                    const res = await fetch(config.endpoint, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ rows: pendingRows })
                    });
                    const data = await res.json();

                    if (!res.ok || !data.success) {
                        throw new Error(data.message || "Import failed");
                    }

                    alert(data.message || "Import successful.");
                    closeModal(csvConfirmModal);
                    resetPendingState();
                    // Hook point: refresh a products table here if/when one exists.
                } catch (err) {
                    console.error(err);
                    alert(`Import failed: ${err.message}`);
                } finally {
                    confirmUploadBtn.disabled = false;
                    confirmUploadBtn.textContent = "Confirm Upload";
                }
            });
        }

        // --- Cancel / close modal ---
        [cancelUploadBtn, modalCloseBtn].forEach((btn) => {
            if (!btn) return;
            btn.addEventListener("click", () => {
                closeModal(csvConfirmModal);
                resetPendingState();
            });
        });

        function resetPendingState() {
            pendingImportType = null;
            pendingRows = [];
            csvUploadInput.value = "";
        }
    });

    // ---------------------------------------------------------------------
    // Small DOM helpers
    // ---------------------------------------------------------------------
    function toggleDropdown(el) {
        if (!el) return;
        el.style.display = el.style.display === "block" ? "none" : "block";
    }
    function closeDropdown(el) {
        if (el) el.style.display = "none";
    }
    function openModal(el) {
        if (el) el.style.display = "flex";
    }
    function closeModal(el) {
        if (el) el.style.display = "none";
    }
    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
})();
