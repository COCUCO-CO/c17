/**
 * Generador de patrones de wallpaper usando la técnica del dominio fundamental.
 * 
 * Basado en el FixedWallpaperGenerator de Python que genera patrones
 * con simetrías matemáticamente correctas.
 * 
 * Técnica: Crear un motivo asimétrico y aplicar las operaciones del grupo
 * para construir la celda unitaria, luego repetir (tile).
 */

const PatternGenerator = {
    
    /**
     * Crear motivo asimétrico aleatorio usando Gaussianas
     */
    createMotif(size, rng, complexity = 3) {
        const motif = new Float32Array(size * size);
        
        for (let k = 0; k < complexity; k++) {
            const cx = rng() * size;
            const cy = rng() * size;
            const sigma = rng() * size / 4 + size / 10;
            const amplitude = rng() * 0.5 + 0.5;
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const value = amplitude * Math.exp(-(dx*dx + dy*dy) / (2 * sigma * sigma));
                    motif[y * size + x] += value;
                }
            }
        }
        
        // Normalizar a [0, 1]
        let max = 0;
        for (let i = 0; i < motif.length; i++) {
            if (motif[i] > max) max = motif[i];
        }
        if (max > 0) {
            for (let i = 0; i < motif.length; i++) {
                motif[i] /= max;
            }
        }
        
        return motif;
    },
    
    /**
     * Flip horizontal (left-right)
     */
    flipLR(data, width, height) {
        const result = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[y * width + x] = data[y * width + (width - 1 - x)];
            }
        }
        return result;
    },
    
    /**
     * Flip vertical (up-down)
     */
    flipUD(data, width, height) {
        const result = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[y * width + x] = data[(height - 1 - y) * width + x];
            }
        }
        return result;
    },
    
    /**
     * Rotar 90° en sentido antihorario
     */
    rot90(data, size) {
        const result = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // (x, y) -> (y, size-1-x)
                result[x * size + (size - 1 - y)] = data[y * size + x];
            }
        }
        return result;
    },
    
    /**
     * Rotar 180°
     */
    rot180(data, size) {
        const result = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                result[(size - 1 - y) * size + (size - 1 - x)] = data[y * size + x];
            }
        }
        return result;
    },
    
    /**
     * Rotar 270° (o -90°)
     */
    rot270(data, size) {
        const result = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // (x, y) -> (size-1-y, x)
                result[(size - 1 - x) * size + y] = data[y * size + x];
            }
        }
        return result;
    },
    
    /**
     * Combinar horizontalmente dos arrays [A | B]
     */
    hstack(a, b, width, height) {
        const result = new Float32Array(height * width * 2);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[y * width * 2 + x] = a[y * width + x];
                result[y * width * 2 + width + x] = b[y * width + x];
            }
        }
        return { data: result, width: width * 2, height: height };
    },
    
    /**
     * Combinar verticalmente dos arrays [A; B]
     */
    vstack(a, b, width, height) {
        const result = new Float32Array(height * 2 * width);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[y * width + x] = a[y * width + x];
                result[(height + y) * width + x] = b[y * width + x];
            }
        }
        return { data: result, width: width, height: height * 2 };
    },
    
    /**
     * Colocar un bloque en una posición de una matriz más grande
     */
    placeBlock(target, targetWidth, block, blockWidth, blockHeight, offsetX, offsetY) {
        for (let y = 0; y < blockHeight; y++) {
            for (let x = 0; x < blockWidth; x++) {
                const ty = offsetY + y;
                const tx = offsetX + x;
                target[ty * targetWidth + tx] = block[y * blockWidth + x];
            }
        }
    },
    
    /**
     * Tile (repetir) la celda para llenar el patrón
     */
    tile(cell, cellWidth, cellHeight, targetSize) {
        const result = new Float32Array(targetSize * targetSize);
        
        for (let y = 0; y < targetSize; y++) {
            for (let x = 0; x < targetSize; x++) {
                const cy = y % cellHeight;
                const cx = x % cellWidth;
                result[y * targetSize + x] = cell[cy * cellWidth + cx];
            }
        }
        
        return result;
    },
    
    // ===== GENERADORES POR GRUPO =====
    
    /**
     * p1: Solo traslaciones
     */
    generateP1(size, rng, motifSize = 64) {
        const motif = this.createMotif(motifSize, rng);
        return this.tile(motif, motifSize, motifSize, size);
    },
    
    /**
     * p2: Rotación 180° 
     * Celda: [fund | ] + rot180 en esquina opuesta
     */
    generateP2(size, rng, motifSize = 64) {
        const halfSize = motifSize;
        const cellSize = halfSize * 2;
        
        const fund = this.createMotif(halfSize, rng);
        const cell = new Float32Array(cellSize * cellSize);
        
        // Upper-left = fund
        this.placeBlock(cell, cellSize, fund, halfSize, halfSize, 0, 0);
        // Lower-right = rot180(fund)
        const rotated = this.rot180(fund, halfSize);
        this.placeBlock(cell, cellSize, rotated, halfSize, halfSize, halfSize, halfSize);
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * pm: Reflexión vertical
     * Celda: [motif | flipLR(motif)]
     */
    generatePM(size, rng, motifSize = 64) {
        const motif = this.createMotif(motifSize, rng);
        const flipped = this.flipLR(motif, motifSize, motifSize);
        const { data, width, height } = this.hstack(motif, flipped, motifSize, motifSize);
        return this.tile(data, width, height, size);
    },
    
    /**
     * pg: Glide reflection
     */
    generatePG(size, rng, motifSize = 64) {
        const motif = this.createMotif(motifSize, rng);
        
        // Glide = flipUD + roll horizontal
        const flipped = this.flipUD(motif, motifSize, motifSize);
        const glided = new Float32Array(motifSize * motifSize);
        const shift = Math.floor(motifSize / 2);
        for (let y = 0; y < motifSize; y++) {
            for (let x = 0; x < motifSize; x++) {
                const srcX = (x - shift + motifSize) % motifSize;
                glided[y * motifSize + x] = flipped[y * motifSize + srcX];
            }
        }
        
        const { data, width, height } = this.hstack(motif, glided, motifSize, motifSize);
        return this.tile(data, width, height, size);
    },
    
    /**
     * cm: Centered reflection - has σᵥ (vertical reflection) symmetry
     * The pattern should be invariant under vertical reflection (flipLR)
     * but NOT under horizontal reflection or glides alone
     */
    generateCM(size, rng, motifSize = 64) {
        const halfMotif = this.createMotif(Math.floor(motifSize / 2), rng);
        
        // Create a cell that has vertical reflection symmetry
        // Cell structure: [M | flipLR(M)] horizontally
        const cellWidth = motifSize;
        const cellHeight = Math.floor(motifSize / 2);
        const cell = new Float32Array(cellWidth * cellHeight);
        
        const halfWidth = Math.floor(motifSize / 2);
        for (let y = 0; y < cellHeight; y++) {
            for (let x = 0; x < halfWidth; x++) {
                const val = halfMotif[y * halfWidth + x];
                cell[y * cellWidth + x] = val;
                cell[y * cellWidth + (cellWidth - 1 - x)] = val;  // flipLR
            }
        }
        
        // For cm, we need centered lattice: shift alternate rows by half cell
        const fullCellHeight = cellHeight * 2;
        const fullCell = new Float32Array(cellWidth * fullCellHeight);
        
        // First row: unshifted
        for (let y = 0; y < cellHeight; y++) {
            for (let x = 0; x < cellWidth; x++) {
                fullCell[y * cellWidth + x] = cell[y * cellWidth + x];
            }
        }
        
        // Second row: shifted by half
        for (let y = 0; y < cellHeight; y++) {
            for (let x = 0; x < cellWidth; x++) {
                const srcX = (x + halfWidth) % cellWidth;
                fullCell[(cellHeight + y) * cellWidth + x] = cell[y * cellWidth + srcX];
            }
        }
        
        return this.tile(fullCell, cellWidth, fullCellHeight, size);
    },
    
    /**
     * pmm: Reflexiones perpendiculares (D2)
     * | M         | flipLR(M) |
     * | flipUD(M) | rot180(M) |
     */
    generatePMM(size, rng, motifSize = 64) {
        const motif = this.createMotif(motifSize, rng);
        
        const flipH = this.flipLR(motif, motifSize, motifSize);
        const flipV = this.flipUD(motif, motifSize, motifSize);
        const rot = this.rot180(motif, motifSize);
        
        const top = this.hstack(motif, flipH, motifSize, motifSize);
        const bottom = this.hstack(flipV, rot, motifSize, motifSize);
        const cell = this.vstack(top.data, bottom.data, top.width, top.height);
        
        return this.tile(cell.data, cell.width, cell.height, size);
    },
    
    /**
     * Rotar 180° una matriz rectangular (width x height)
     */
    rot180Rect(data, width, height) {
        const result = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[(height - 1 - y) * width + (width - 1 - x)] = data[y * width + x];
            }
        }
        return result;
    },
    
    /**
     * pmg: Reflexión vertical + glide horizontal → C₂ emerge
     * Simetrías: σᵥ (reflexión vertical) y C₂ (rotación 180°)
     * NO tiene: σₕ (reflexión horizontal pura) - es glide
     */
    generatePMG(size, rng, motifSize = 64) {
        const quarterSize = Math.floor(motifSize / 2);
        const cellSize = motifSize * 2;
        
        // Create asymmetric fundamental domain
        const fund = this.createMotif(quarterSize, rng);
        const cell = new Float32Array(cellSize * cellSize);
        
        // Build cell with σᵥ and C₂ symmetry
        // The cell is 2x2 quarters:
        // | A        | flipLR(A) |
        // | rot180(flipLR(A)) | rot180(A) |
        // This gives σᵥ (vertical reflection) and C₂ (180° rotation)
        // but NOT σₕ (horizontal reflection)
        
        for (let y = 0; y < quarterSize; y++) {
            for (let x = 0; x < quarterSize; x++) {
                const val = fund[y * quarterSize + x];
                
                // Top-left: A
                cell[y * cellSize + x] = val;
                
                // Top-right: flipLR(A)
                cell[y * cellSize + (cellSize - 1 - x)] = val;
                
                // Bottom-right: rot180(A)
                cell[(cellSize - 1 - y) * cellSize + (cellSize - 1 - x)] = val;
                
                // Bottom-left: rot180(flipLR(A)) = flipLR(rot180(A))
                cell[(cellSize - 1 - y) * cellSize + x] = val;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * pgg: Dos glides perpendiculares -> C₂
     * Simetrías: C₂ (rotación 180°) SOLAMENTE
     * NO tiene: σᵥ, σₕ (las reflexiones son glides, no puras)
     */
    generatePGG(size, rng, motifSize = 64) {
        const halfSize = motifSize;
        const cellSize = halfSize * 2;
        
        // Create asymmetric fundamental domain
        const fund = this.createMotif(halfSize, rng);
        const cell = new Float32Array(cellSize * cellSize);
        
        // Build cell with ONLY C₂ symmetry (no pure reflections)
        // Place fund in upper-left and rot180(fund) in lower-right
        // The other two quadrants should be DIFFERENT from flipLR or flipUD
        // to avoid creating pure reflection symmetry
        
        // Upper-left: A
        this.placeBlock(cell, cellSize, fund, halfSize, halfSize, 0, 0);
        
        // Lower-right: rot180(A) - this creates C₂ symmetry
        const rot = this.rot180(fund, halfSize);
        this.placeBlock(cell, cellSize, rot, halfSize, halfSize, halfSize, halfSize);
        
        // Upper-right and Lower-left: use glided versions (not pure flips)
        // This ensures NO pure reflection symmetry
        const flipped = this.flipUD(fund, halfSize, halfSize);
        const shift = Math.floor(halfSize / 2);
        const glided = new Float32Array(halfSize * halfSize);
        for (let y = 0; y < halfSize; y++) {
            for (let x = 0; x < halfSize; x++) {
                const srcX = (x + shift) % halfSize;
                glided[y * halfSize + x] = flipped[y * halfSize + srcX];
            }
        }
        
        // Upper-right: glided version
        this.placeBlock(cell, cellSize, glided, halfSize, halfSize, halfSize, 0);
        
        // Lower-left: rot180(glided) to maintain C₂
        const glidedRot = this.rot180(glided, halfSize);
        this.placeBlock(cell, cellSize, glidedRot, halfSize, halfSize, 0, halfSize);
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * cmm: Celda centrada con reflexiones perpendiculares (D₂)
     * Simetrías: {e, C₂, σᵥ, σₕ} - NO incluye glides puros
     * 
     * Técnica: Crear celda pmm-like (4 cuadrantes) sin superposición
     */
    generateCMM(size, rng, motifSize = 64) {
        // Para cmm usamos celda doble para el centrado
        const halfSize = motifSize;
        const cellSize = halfSize * 2;
        
        const motif = this.createMotif(halfSize, rng);
        
        // Crear celda con simetría D₂ (C₂ + σᵥ + σₕ)
        // | M         | flipLR(M) |
        // | flipUD(M) | rot180(M) |
        const flipH = this.flipLR(motif, halfSize, halfSize);
        const flipV = this.flipUD(motif, halfSize, halfSize);
        const rot = this.rot180(motif, halfSize);
        
        const cell = new Float32Array(cellSize * cellSize);
        
        // Colocar los 4 cuadrantes
        this.placeBlock(cell, cellSize, motif, halfSize, halfSize, 0, 0);
        this.placeBlock(cell, cellSize, flipH, halfSize, halfSize, halfSize, 0);
        this.placeBlock(cell, cellSize, flipV, halfSize, halfSize, 0, halfSize);
        this.placeBlock(cell, cellSize, rot, halfSize, halfSize, halfSize, halfSize);
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * p4: Rotación 90° (C4, sin reflexión)
     */
    generateP4(size, rng, motifSize = 64) {
        const fund = this.createMotif(motifSize, rng);
        const cellSize = motifSize * 2;
        const cell = new Float32Array(cellSize * cellSize);
        
        // Place fund and its rotations in 4 quadrants
        this.placeBlock(cell, cellSize, fund, motifSize, motifSize, 0, 0);
        
        const rot270 = this.rot270(fund, motifSize);
        this.placeBlock(cell, cellSize, rot270, motifSize, motifSize, motifSize, 0);
        
        const rot180 = this.rot180(fund, motifSize);
        this.placeBlock(cell, cellSize, rot180, motifSize, motifSize, motifSize, motifSize);
        
        const rot90 = this.rot90(fund, motifSize);
        this.placeBlock(cell, cellSize, rot90, motifSize, motifSize, 0, motifSize);
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * p4m: C4 + reflexiones (D4)
     */
    generateP4M(size, rng, motifSize = 64) {
        // Crear motivo con simetría D4 incorporada
        const motif = this.createMotif(motifSize, rng);
        
        // Simetrizar el motivo para D4
        const symMotif = new Float32Array(motifSize * motifSize);
        for (let y = 0; y < motifSize; y++) {
            for (let x = 0; x < motifSize; x++) {
                const val = motif[y * motifSize + x];
                // Aplicar todas las simetrías de D4
                const mx = motifSize - 1 - x;
                const my = motifSize - 1 - y;
                
                symMotif[y * motifSize + x] += val;
                symMotif[y * motifSize + mx] += val;  // flip horizontal
                symMotif[my * motifSize + x] += val;  // flip vertical
                symMotif[my * motifSize + mx] += val; // rot180
                symMotif[x * motifSize + y] += val;   // diagonal reflection
                symMotif[mx * motifSize + my] += val; // anti-diagonal reflection
                symMotif[x * motifSize + my] += val;  // rot90 + flip
                symMotif[mx * motifSize + y] += val;  // rot270 + flip
            }
        }
        
        // Normalizar
        let max = 0;
        for (let i = 0; i < symMotif.length; i++) {
            if (symMotif[i] > max) max = symMotif[i];
        }
        if (max > 0) {
            for (let i = 0; i < symMotif.length; i++) {
                symMotif[i] /= max;
            }
        }
        
        return this.tile(symMotif, motifSize, motifSize, size);
    },
    
    /**
     * p4g: C₄ + reflexiones DIAGONALES (σ_d, σ_d'), NO axiales
     * Simetrías: C₄, C₂, C₄³, σ_d, σ_d′
     * NO tiene: σᵥ, σₕ (son glides en p4g)
     */
    generateP4G(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const cell = new Float32Array(cellSize * cellSize);
        
        // Create asymmetric fundamental domain (1/8 of cell - triangular sector)
        const fundSize = motifSize;
        const fund = this.createMotif(fundSize, rng);
        
        const cx = cellSize / 2;
        const cy = cellSize / 2;
        
        // p4g has 8 sectors: C₄ (4 rotations) × σ_d (diagonal reflection)
        // Sectors 0,2,4,6 are related by C₄
        // Sectors 1,3,5,7 are diagonal reflections of sectors 0,2,4,6
        const sectorAngle = Math.PI / 4;  // 45° per sector
        
        for (let y = 0; y < cellSize; y++) {
            for (let x = 0; x < cellSize; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                
                let angle = Math.atan2(dy, dx);
                if (angle < 0) angle += 2 * Math.PI;
                
                // Find which sector (0-7)
                const sector = Math.floor(angle / sectorAngle) % 8;
                
                // Map to fundamental sector [0, π/4)
                let localAngle = angle - sector * sectorAngle;
                
                // For odd sectors, apply diagonal reflection (swap angle within sector)
                if (sector % 2 === 1) {
                    localAngle = sectorAngle - localAngle;
                }
                
                // Map back to source coordinates in fundamental domain
                const srcX = r * Math.cos(localAngle) + cx;
                const srcY = r * Math.sin(localAngle) + cy;
                
                const ix = Math.min(Math.max(Math.floor(srcX), 0), cellSize - 1);
                const iy = Math.min(Math.max(Math.floor(srcY), 0), cellSize - 1);
                
                // Sample from fundamental domain
                const fx = Math.abs(ix % fundSize);
                const fy = Math.abs(iy % fundSize);
                cell[y * cellSize + x] = fund[fy * fundSize + fx];
            }
        }
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * Crear patrón con simetría Cn o Dn usando mapeo al sector fundamental
     * NO promedia - copia directamente del sector fundamental
     * Esto evita crear simetrías de reflexión accidentales
     * 
     * @param base - patrón base (asimétrico)
     * @param size - tamaño del patrón
     * @param order - orden de rotación (3 para C₃, 6 para C₆)
     * @param withReflection - si true, añade reflexiones (Dn en vez de Cn)
     */
    symmetrizeRotational(base, size, order, withReflection = false) {
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;  // Use exact center
        const cy = (size - 1) / 2;
        
        const sectorAngle = (2 * Math.PI) / order;
        const halfSector = sectorAngle / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                
                let angle = Math.atan2(dy, dx);
                if (angle < 0) angle += 2 * Math.PI;
                
                // Determine sector (0 to order-1)
                const sector = Math.floor(angle / sectorAngle);
                let localAngle = angle - sector * sectorAngle;
                
                // If reflection symmetry, fold to half sector
                if (withReflection && localAngle > halfSector) {
                    localAngle = sectorAngle - localAngle;
                }
                
                // Map back to fundamental sector coordinates
                const srcX = r * Math.cos(localAngle) + cx;
                const srcY = r * Math.sin(localAngle) + cy;
                
                // Bilinear interpolation for smoother results
                const x0 = Math.floor(srcX);
                const y0 = Math.floor(srcY);
                const x1 = Math.min(x0 + 1, size - 1);
                const y1 = Math.min(y0 + 1, size - 1);
                
                if (x0 >= 0 && x0 < size && y0 >= 0 && y0 < size) {
                    const fx = srcX - x0;
                    const fy = srcY - y0;
                    
                    const v00 = base[y0 * size + x0];
                    const v10 = base[y0 * size + x1];
                    const v01 = base[y1 * size + x0];
                    const v11 = base[y1 * size + x1];
                    
                    result[y * size + x] = 
                        v00 * (1 - fx) * (1 - fy) +
                        v10 * fx * (1 - fy) +
                        v01 * (1 - fx) * fy +
                        v11 * fx * fy;
                } else {
                    // Edge case - nearest neighbor
                    const ix = Math.min(Math.max(Math.round(srcX), 0), size - 1);
                    const iy = Math.min(Math.max(Math.round(srcY), 0), size - 1);
                    result[y * size + x] = base[iy * size + ix];
                }
            }
        }
        
        return result;
    },
    
    /**
     * p3: C₃ solo - rotación 120°, SIN reflexiones
     * Simetrías: C₃ (120°), C₃² (240°)
     * NO tiene: C₂, σᵥ, σₕ
     */
    generateP3(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const base = this.createMotif(cellSize, rng);
        
        // Apply C₃ symmetry WITHOUT reflections
        const cell = this.symmetrizeRotational(base, cellSize, 3, false);
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * p3m1: C₃ + reflexiones a través de centros de rotación (D₃)
     * Simetrías: C₃, C₃², σ₁, σ₂, σ₃ (3 ejes de reflexión)
     * Los ejes de reflexión pasan POR los centros de rotación
     */
    generateP3M1(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const base = this.createMotif(cellSize, rng);
        
        // D₃ = C₃ + reflexión (6 sectors total)
        const cell = this.symmetrizeRotational(base, cellSize, 3, true);
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * p31m: C₃ + reflexiones entre centros (D₃ pero con ejes diferentes a p3m1)
     * Simetrías: C₃, C₃², σ₁, σ₂, σ₃ (3 ejes de reflexión rotados 30° vs p3m1)
     * Los ejes de reflexión pasan ENTRE los centros de rotación
     */
    generateP31M(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const base = this.createMotif(cellSize, rng);
        
        const result = new Float32Array(cellSize * cellSize);
        const cx = (cellSize - 1) / 2;
        const cy = (cellSize - 1) / 2;
        
        const sectorAngle = (2 * Math.PI) / 3;  // 120° sectors
        const halfSector = sectorAngle / 2;
        const axisOffset = Math.PI / 6;  // 30° offset for p31m reflection axes
        
        for (let y = 0; y < cellSize; y++) {
            for (let x = 0; x < cellSize; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                
                // Rotate coordinate system by 30° to align with p31m axes
                let angle = Math.atan2(dy, dx) - axisOffset;
                if (angle < 0) angle += 2 * Math.PI;
                
                // Find sector and local angle within sector
                const sector = Math.floor(angle / sectorAngle);
                let localAngle = angle - sector * sectorAngle;
                
                // Fold to half-sector for reflection symmetry
                if (localAngle > halfSector) {
                    localAngle = sectorAngle - localAngle;
                }
                
                // Rotate back
                localAngle += axisOffset;
                
                // Map to source coordinates
                const srcX = r * Math.cos(localAngle) + cx;
                const srcY = r * Math.sin(localAngle) + cy;
                
                // Sample with bilinear interpolation
                const x0 = Math.floor(srcX);
                const y0 = Math.floor(srcY);
                
                if (x0 >= 0 && x0 < cellSize - 1 && y0 >= 0 && y0 < cellSize - 1) {
                    const fx = srcX - x0;
                    const fy = srcY - y0;
                    
                    const v00 = base[y0 * cellSize + x0];
                    const v10 = base[y0 * cellSize + x0 + 1];
                    const v01 = base[(y0 + 1) * cellSize + x0];
                    const v11 = base[(y0 + 1) * cellSize + x0 + 1];
                    
                    result[y * cellSize + x] = 
                        v00 * (1 - fx) * (1 - fy) +
                        v10 * fx * (1 - fy) +
                        v01 * (1 - fx) * fy +
                        v11 * fx * fy;
                } else {
                    const ix = Math.min(Math.max(Math.round(srcX), 0), cellSize - 1);
                    const iy = Math.min(Math.max(Math.round(srcY), 0), cellSize - 1);
                    result[y * cellSize + x] = base[iy * cellSize + ix];
                }
            }
        }
        
        // Normalize
        let max = 0;
        for (let i = 0; i < result.length; i++) {
            if (result[i] > max) max = result[i];
        }
        if (max > 0) {
            for (let i = 0; i < result.length; i++) {
                result[i] /= max;
            }
        }
        
        return this.tile(result, cellSize, cellSize, size);
    },
    
    /**
     * p6: C₆ solo - rotación 60°, SIN reflexiones
     * Simetrías: C₆ (60°), C₃ (120°), C₂ (180°), C₃² (240°), C₆⁵ (300°)
     * NO tiene: σᵥ, σₕ, σ_d
     */
    generateP6(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const base = this.createMotif(cellSize, rng);
        
        // C₆ symmetry without reflections (6 sectors)
        const cell = this.symmetrizeRotational(base, cellSize, 6, false);
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * p6m: C₆ + reflexiones (D₆) - máxima simetría hexagonal
     * Simetrías: C₆, C₃, C₂, C₃², C₆⁵, σ₁...σ₆ (6 ejes de reflexión)
     * El grupo puntual D₆ tiene 12 elementos
     */
    generateP6M(size, rng, motifSize = 64) {
        const cellSize = motifSize * 2;
        const base = this.createMotif(cellSize, rng);
        
        // D₆ = C₆ + reflexión (12 sectors total)
        const cell = this.symmetrizeRotational(base, cellSize, 6, true);
        
        // Normalize
        let max = 0;
        for (let i = 0; i < cell.length; i++) {
            if (cell[i] > max) max = cell[i];
        }
        if (max > 0) {
            for (let i = 0; i < cell.length; i++) {
                cell[i] /= max;
            }
        }
        
        return this.tile(cell, cellSize, cellSize, size);
    },
    
    /**
     * Generar patrón para cualquier grupo
     */
    generateFromGenerators(groupName, size, options = {}) {
        const rng = options.rng || Math.random;
        const motifSize = options.motifSize || Math.floor(size / 4);
        
        const generators = {
            'p1': () => this.generateP1(size, rng, motifSize),
            'p2': () => this.generateP2(size, rng, motifSize),
            'pm': () => this.generatePM(size, rng, motifSize),
            'pg': () => this.generatePG(size, rng, motifSize),
            'cm': () => this.generateCM(size, rng, motifSize),
            'pmm': () => this.generatePMM(size, rng, motifSize),
            'pmg': () => this.generatePMG(size, rng, motifSize),
            'pgg': () => this.generatePGG(size, rng, motifSize),
            'cmm': () => this.generateCMM(size, rng, motifSize),
            'p4': () => this.generateP4(size, rng, motifSize),
            'p4m': () => this.generateP4M(size, rng, motifSize),
            'p4g': () => this.generateP4G(size, rng, motifSize),
            'p3': () => this.generateP3(size, rng, motifSize),
            'p3m1': () => this.generateP3M1(size, rng, motifSize),
            'p31m': () => this.generateP31M(size, rng, motifSize),
            'p6': () => this.generateP6(size, rng, motifSize),
            'p6m': () => this.generateP6M(size, rng, motifSize),
        };
        
        const generator = generators[groupName];
        if (!generator) {
            console.error(`Grupo ${groupName} no encontrado`);
            return new Float32Array(size * size);
        }
        
        return generator();
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.PatternGenerator = PatternGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternGenerator;
}
