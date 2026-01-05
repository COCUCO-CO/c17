/**
 * Generador de patrones de wallpaper con SIMETRÍAS EXACTAS
 * 
 * PRINCIPIO: Las transformaciones usadas aquí DEBEN coincidir EXACTAMENTE
 * con las transformaciones de ImageTransform en symmetry.js
 * 
 * Transformaciones de ImageTransform:
 * - rotate90 CCW:  dest(x,y) = src(y, W-1-x)       -> simetría: f(x,y) = f(y, W-1-x)
 * - rotate180:     dest(x,y) = src(W-1-x, H-1-y)   -> simetría: f(x,y) = f(W-1-x, H-1-y)
 * - rotate270:     dest(x,y) = src(H-1-y, x)       -> simetría: f(x,y) = f(H-1-y, x)
 * - reflect_v:     dest(x,y) = src(W-1-x, y)       -> simetría: f(x,y) = f(W-1-x, y)
 * - reflect_h:     dest(x,y) = src(x, H-1-y)       -> simetría: f(x,y) = f(x, H-1-y)
 * - reflect_d:     dest(x,y) = src(y, x)           -> simetría: f(x,y) = f(y, x)
 * - reflect_ad:    dest(x,y) = src(H-1-y, W-1-x)   -> simetría: f(x,y) = f(H-1-y, W-1-x)
 */

const PatternGenerator = {
    
    /**
     * Crear motivo asimétrico aleatorio usando Gaussianas
     */
    createMotif(size, rng, complexity = 5) {
        const motif = new Float32Array(size * size);
        
        for (let k = 0; k < complexity; k++) {
            const cx = rng() * size;
            const cy = rng() * size;
            const sigma = rng() * size / 4 + size / 8;
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
        
        return this.normalize(motif);
    },
    
    /**
     * Normalizar array a [0, 1]
     */
    normalize(data) {
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < data.length; i++) {
            if (data[i] < min) min = data[i];
            if (data[i] > max) max = data[i];
        }
        const range = max - min || 1;
        for (let i = 0; i < data.length; i++) {
            data[i] = (data[i] - min) / range;
        }
        return data;
    },
    
    /**
     * Obtener valor con interpolación bilinear y wrapping
     */
    sampleBilinear(data, size, x, y) {
        // Wrap coordinates for periodic patterns
        x = ((x % size) + size) % size;
        y = ((y % size) + size) % size;
        
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = (x0 + 1) % size;
        const y1 = (y0 + 1) % size;
        
        const fx = x - x0;
        const fy = y - y0;
        
        const v00 = data[y0 * size + x0];
        const v10 = data[y0 * size + x1];
        const v01 = data[y1 * size + x0];
        const v11 = data[y1 * size + x1];
        
        return v00 * (1-fx) * (1-fy) + v10 * fx * (1-fy) + 
               v01 * (1-fx) * fy + v11 * fx * fy;
    },
    
    /**
     * Shorthand for size-1
     */
    W(size) { return size - 1; },
    
    /**
     * p1: Solo traslaciones (sin simetría puntual)
     */
    generateP1(size, rng) {
        return this.normalize(this.createMotif(size, rng));
    },
    
    /**
     * p2: Rotación 180° - f(x,y) = f(W-x, W-y)
     */
    generateP2(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, W - y);  // C2
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pm: Reflexión vertical - f(x,y) = f(W-x, y)
     */
    generatePM(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y);  // σv
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pg: Glide reflection - f(x,y) = f(W-x, y + H/2)
     */
    generatePG(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const halfSize = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y + halfSize);  // glide
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * cm: Reflexión + glide (centered)
     */
    generateCM(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const halfSize = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y);              // σv
                const v3 = this.sampleBilinear(base, size, x + halfSize, y + halfSize);  // centered translation
                const v4 = this.sampleBilinear(base, size, W - x + halfSize, y + halfSize);
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pmm: Reflexiones horizontal y vertical (D2)
     * f(x,y) = f(W-x, y) = f(x, W-y) = f(W-x, W-y)
     */
    generatePMM(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y);      // σv
                const v3 = this.sampleBilinear(base, size, x, W - y);      // σh
                const v4 = this.sampleBilinear(base, size, W - x, W - y);  // C2
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pmg: Reflexión vertical + rotación 180° (pero no reflexión horizontal - es glide)
     */
    generatePMG(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const halfSize = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y);          // σv
                const v3 = this.sampleBilinear(base, size, W - x, W - y);      // C2
                const v4 = this.sampleBilinear(base, size, x, W - y + halfSize); // glide h
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pgg: Two perpendicular glides (no pure reflection, but has C2)
     */
    generatePGG(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const halfSize = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, W - y);          // C2
                const v3 = this.sampleBilinear(base, size, W - x, y + halfSize);   // glide v
                const v4 = this.sampleBilinear(base, size, x + halfSize, W - y);   // glide h
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * cmm: Como pmm pero con celda centrada
     */
    generateCMM(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);
                const v2 = this.sampleBilinear(base, size, W - x, y);      // σv
                const v3 = this.sampleBilinear(base, size, x, W - y);      // σh
                const v4 = this.sampleBilinear(base, size, W - x, W - y);  // C2
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p4: Rotación 90° (C4) - usando EXACTAMENTE las mismas transformaciones que ImageTransform
     * 
     * ImageTransform._rotate90: dest(x,y) = src(y, W-x)
     * Entonces para simetría: f(x,y) = f(y, W-x) = f(W-x, W-y) = f(W-y, x)
     */
    generateP4(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = this.sampleBilinear(base, size, x, y);         // e
                const v2 = this.sampleBilinear(base, size, y, W - x);     // C4 (90° CCW)
                const v3 = this.sampleBilinear(base, size, W - x, W - y); // C2 (180°)
                const v4 = this.sampleBilinear(base, size, W - y, x);     // C4³ (270° CCW)
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p4m: Rotación 90° + todas las reflexiones (D4)
     * 
     * Simetrías:
     * - e:   f(x, y)
     * - C4:  f(y, W-x)
     * - C2:  f(W-x, W-y)
     * - C4³: f(W-y, x)
     * - σv:  f(W-x, y)
     * - σh:  f(x, W-y)
     * - σd:  f(y, x)
     * - σd': f(W-y, W-x)
     */
    generateP4M(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Rotaciones
                const v1 = this.sampleBilinear(base, size, x, y);         // e
                const v2 = this.sampleBilinear(base, size, y, W - x);     // C4
                const v3 = this.sampleBilinear(base, size, W - x, W - y); // C2
                const v4 = this.sampleBilinear(base, size, W - y, x);     // C4³
                
                // Reflexiones
                const v5 = this.sampleBilinear(base, size, W - x, y);     // σv
                const v6 = this.sampleBilinear(base, size, x, W - y);     // σh
                const v7 = this.sampleBilinear(base, size, y, x);         // σd
                const v8 = this.sampleBilinear(base, size, W - y, W - x); // σd'
                
                result[y * size + x] = (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 8;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p4g: C4 + diagonal reflections only (NOT axial)
     * σv y σh son glides en p4g, no reflexiones puras
     */
    generateP4G(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const halfSize = size / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // C4 rotaciones
                const v1 = this.sampleBilinear(base, size, x, y);         // e
                const v2 = this.sampleBilinear(base, size, y, W - x);     // C4
                const v3 = this.sampleBilinear(base, size, W - x, W - y); // C2
                const v4 = this.sampleBilinear(base, size, W - y, x);     // C4³
                
                // Reflexiones diagonales
                const v5 = this.sampleBilinear(base, size, y, x);         // σd
                const v6 = this.sampleBilinear(base, size, W - y, W - x); // σd'
                
                // Glides axiales (no reflexiones puras)
                const v7 = this.sampleBilinear(base, size, W - x + halfSize, y); // gv
                const v8 = this.sampleBilinear(base, size, x, W - y + halfSize); // gh
                
                result[y * size + x] = (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 8;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p3: Rotación 120° (C3)
     * 
     * Para rotación general de ángulo θ alrededor del centro (cx, cy):
     * dest(x,y) = src at rotated coordinates
     * 
     * Para 120° CCW: cos=-0.5, sin=√3/2
     * Simetría: f(x,y) = f(rotated_120(x,y)) = f(rotated_240(x,y))
     */
    generateP3(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        const cos120 = -0.5;
        const sin120 = Math.sqrt(3) / 2;
        const cos240 = -0.5;
        const sin240 = -Math.sqrt(3) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                
                // e: identity
                const v1 = this.sampleBilinear(base, size, x, y);
                
                // C3 (120° CCW): source coordinates for inverse rotation
                // To fill dest(x,y) from rotated image, we need src at (-120° rotation of (x,y))
                // -120° rotation: cos=cos(-120)=-0.5, sin=sin(-120)=-√3/2
                const sx1 = cos120 * dx + sin120 * dy + cx;  // note: +sin for inverse
                const sy1 = -sin120 * dx + cos120 * dy + cy;
                const v2 = this.sampleBilinear(base, size, sx1, sy1);
                
                // C3² (240° CCW): inverse is -240° = 120°
                const sx2 = cos240 * dx + sin240 * dy + cx;
                const sy2 = -sin240 * dx + cos240 * dy + cy;
                const v3 = this.sampleBilinear(base, size, sx2, sy2);
                
                result[y * size + x] = (v1 + v2 + v3) / 3;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p3m1: C3 + 3 reflexiones (D3)
     * Ejes de reflexión a 0°, 60°, 120° desde vertical
     */
    generateP3M1(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                
                let sum = 0;
                
                // C3 rotations (0°, 120°, 240°)
                const rotAngles = [0, 120, 240];
                for (const angle of rotAngles) {
                    const rad = -angle * Math.PI / 180;  // negative for inverse
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const sx = cos * dx - sin * dy + cx;
                    const sy = sin * dx + cos * dy + cy;
                    sum += this.sampleBilinear(base, size, sx, sy);
                }
                
                // 3 reflexiones (ejes a 0°, 60°, 120° = ejes verticales rotados)
                // Reflexión sobre eje a ángulo θ: x' = x*cos(2θ) + y*sin(2θ), y' = x*sin(2θ) - y*cos(2θ)
                const refAxisAngles = [90, 150, 210];  // 90° = vertical axis, etc.
                for (const axisAngle of refAxisAngles) {
                    const theta2 = 2 * axisAngle * Math.PI / 180;
                    const cos2 = Math.cos(theta2);
                    const sin2 = Math.sin(theta2);
                    const mx = cos2 * dx + sin2 * dy + cx;
                    const my = sin2 * dx - cos2 * dy + cy;
                    sum += this.sampleBilinear(base, size, mx, my);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p31m: C3 + 3 reflexiones con ejes rotados 30° respecto a p3m1
     */
    generateP31M(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                
                let sum = 0;
                
                // C3 rotations
                const rotAngles = [0, 120, 240];
                for (const angle of rotAngles) {
                    const rad = -angle * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const sx = cos * dx - sin * dy + cx;
                    const sy = sin * dx + cos * dy + cy;
                    sum += this.sampleBilinear(base, size, sx, sy);
                }
                
                // 3 reflexiones con ejes a 0° (horizontal), 60°, 120°
                const refAxisAngles = [0, 60, 120];
                for (const axisAngle of refAxisAngles) {
                    const theta2 = 2 * axisAngle * Math.PI / 180;
                    const cos2 = Math.cos(theta2);
                    const sin2 = Math.sin(theta2);
                    const mx = cos2 * dx + sin2 * dy + cx;
                    const my = sin2 * dx - cos2 * dy + cy;
                    sum += this.sampleBilinear(base, size, mx, my);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p6: Rotación 60° (C6)
     */
    generateP6(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        const rotAngles = [0, 60, 120, 180, 240, 300];
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                
                let sum = 0;
                for (const angle of rotAngles) {
                    const rad = -angle * Math.PI / 180;  // negative for inverse mapping
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const sx = cos * dx - sin * dy + cx;
                    const sy = sin * dx + cos * dy + cy;
                    sum += this.sampleBilinear(base, size, sx, sy);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p6m: C6 + 6 reflexiones (D6) - máxima simetría
     */
    generateP6M(size, rng) {
        const base = this.createMotif(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        const rotAngles = [0, 60, 120, 180, 240, 300];
        const refAxisAngles = [0, 30, 60, 90, 120, 150];  // 6 ejes de reflexión
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                
                let sum = 0;
                
                // 6 rotaciones
                for (const angle of rotAngles) {
                    const rad = -angle * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const sx = cos * dx - sin * dy + cx;
                    const sy = sin * dx + cos * dy + cy;
                    sum += this.sampleBilinear(base, size, sx, sy);
                }
                
                // 6 reflexiones
                for (const axisAngle of refAxisAngles) {
                    const theta2 = 2 * axisAngle * Math.PI / 180;
                    const cos2 = Math.cos(theta2);
                    const sin2 = Math.sin(theta2);
                    const mx = cos2 * dx + sin2 * dy + cx;
                    const my = sin2 * dx - cos2 * dy + cy;
                    sum += this.sampleBilinear(base, size, mx, my);
                }
                
                result[y * size + x] = sum / 12;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * Generar patrón para cualquier grupo
     */
    generateFromGenerators(groupName, size, options = {}) {
        const rng = options.rng || Math.random;
        
        const generators = {
            'p1': () => this.generateP1(size, rng),
            'p2': () => this.generateP2(size, rng),
            'pm': () => this.generatePM(size, rng),
            'pg': () => this.generatePG(size, rng),
            'cm': () => this.generateCM(size, rng),
            'pmm': () => this.generatePMM(size, rng),
            'pmg': () => this.generatePMG(size, rng),
            'pgg': () => this.generatePGG(size, rng),
            'cmm': () => this.generateCMM(size, rng),
            'p4': () => this.generateP4(size, rng),
            'p4m': () => this.generateP4M(size, rng),
            'p4g': () => this.generateP4G(size, rng),
            'p3': () => this.generateP3(size, rng),
            'p3m1': () => this.generateP3M1(size, rng),
            'p31m': () => this.generateP31M(size, rng),
            'p6': () => this.generateP6(size, rng),
            'p6m': () => this.generateP6M(size, rng),
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
