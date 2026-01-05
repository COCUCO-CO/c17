/**
 * Generador de patrones de wallpaper con SIMETRÍAS EXACTAS
 * 
 * ENFOQUE: Generar patrones que son INTRÍNSECAMENTE simétricos
 * usando funciones matemáticas que tienen la simetría incorporada.
 * 
 * Para rotaciones: usar funciones f(r, θ mod (360°/n))
 * Para reflexiones: usar funciones f(|x - cx|, y) o f(x, |y - cy|)
 */

const PatternGenerator = {
    
    /**
     * Crear ruido base usando Gaussianas
     */
    createNoise(size, rng, complexity = 5) {
        const noise = new Float32Array(size * size);
        
        for (let k = 0; k < complexity; k++) {
            const cx = rng() * size;
            const cy = rng() * size;
            const sigma = rng() * size / 4 + size / 8;
            const amplitude = rng() * 0.5 + 0.5;
            
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    noise[y * size + x] += amplitude * Math.exp(-(dx*dx + dy*dy) / (2 * sigma * sigma));
                }
            }
        }
        
        return noise;
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
     * Sample con wrapping (para patrones periódicos)
     */
    sample(data, size, x, y) {
        x = Math.floor(((x % size) + size) % size);
        y = Math.floor(((y % size) + size) % size);
        return data[y * size + x];
    },
    
    /**
     * Constantes matemáticas
     */
    W(size) { return size - 1; },
    
    // =====================================================
    // GRUPOS SIN ROTACIÓN O CON ROTACIÓN 180°
    // =====================================================
    
    /**
     * p1: Solo traslaciones
     */
    generateP1(size, rng) {
        return this.normalize(this.createNoise(size, rng));
    },
    
    /**
     * p2: Rotación 180°
     * Simetría: f(x,y) = f(W-x, W-y)
     */
    generateP2(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Promedio con el punto rotado 180°
                const v1 = noise[y * size + x];
                const x2 = W - x, y2 = W - y;
                const v2 = noise[y2 * size + x2];
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pm: Reflexión vertical - f(x,y) = f(W-x, y)
     */
    generatePM(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const v2 = noise[y * size + (W - x)];
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pg: Glide vertical
     */
    generatePG(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const H2 = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const y2 = (y + H2) % size;
                const v2 = noise[y2 * size + (W - x)];
                result[y * size + x] = (v1 + v2) / 2;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * cm: Reflexión + centrado
     */
    generateCM(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const H2 = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const v2 = noise[y * size + (W - x)];
                const y3 = (y + H2) % size;
                const x3 = (x + H2) % size;
                const v3 = noise[y3 * size + x3];
                const v4 = noise[y3 * size + (W - x3 + size) % size];
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pmm: Reflexiones horizontal y vertical (D2)
     */
    generatePMM(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const v2 = noise[y * size + (W - x)];         // σv
                const v3 = noise[(W - y) * size + x];         // σh
                const v4 = noise[(W - y) * size + (W - x)];   // C2
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pmg: σv + C2 (pero σh es glide)
     */
    generatePMG(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const H2 = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const v2 = noise[y * size + (W - x)];                    // σv
                const v3 = noise[(W - y) * size + (W - x)];              // C2
                const v4 = noise[((W - y) + H2) % size * size + x];      // glide h
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * pgg: Dos glides perpendiculares, C2
     */
    generatePGG(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const H2 = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v1 = noise[y * size + x];
                const v2 = noise[(W - y) * size + (W - x)];              // C2
                const v3 = noise[((y + H2) % size) * size + (W - x)];    // glide v
                const v4 = noise[((W - y + H2) % size) * size + x];      // glide h
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * cmm: D2 con celda centrada
     */
    generateCMM(size, rng) {
        return this.generatePMM(size, rng);  // Mismo grupo puntual
    },
    
    // =====================================================
    // p4, p4m, p4g - Simetría C4/D4
    // Usamos índices discretos para evitar errores de interpolación
    // =====================================================
    
    /**
     * p4: Rotación 90° (C4)
     * Transformación exacta: f(x,y) = f(y, W-x) = f(W-x, W-y) = f(W-y, x)
     */
    generateP4(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Las 4 posiciones relacionadas por C4
                const v1 = noise[y * size + x];              // e
                const v2 = noise[(W - x) * size + y];        // C4 (90° CCW)
                const v3 = noise[(W - y) * size + (W - x)];  // C2 (180°)
                const v4 = noise[x * size + (W - y)];        // C4³ (270° CCW)
                result[y * size + x] = (v1 + v2 + v3 + v4) / 4;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p4m: D4 - C4 + todas las reflexiones
     */
    generateP4M(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Rotaciones C4
                const v1 = noise[y * size + x];              // e
                const v2 = noise[(W - x) * size + y];        // C4
                const v3 = noise[(W - y) * size + (W - x)];  // C2
                const v4 = noise[x * size + (W - y)];        // C4³
                
                // Reflexiones
                const v5 = noise[y * size + (W - x)];        // σv
                const v6 = noise[(W - y) * size + x];        // σh
                const v7 = noise[x * size + y];              // σd (diagonal)
                const v8 = noise[(W - x) * size + (W - y)];  // σd' (anti-diagonal)
                
                result[y * size + x] = (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 8;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p4g: C4 + σd, σd' (diagonales), pero σv y σh son GLIDES
     */
    generateP4G(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const W = size - 1;
        const H2 = Math.floor(size / 2);
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Rotaciones C4
                const v1 = noise[y * size + x];              // e
                const v2 = noise[(W - x) * size + y];        // C4
                const v3 = noise[(W - y) * size + (W - x)];  // C2
                const v4 = noise[x * size + (W - y)];        // C4³
                
                // Reflexiones DIAGONALES (puras)
                const v5 = noise[x * size + y];              // σd
                const v6 = noise[(W - x) * size + (W - y)];  // σd'
                
                // Glides AXIALES (reflexión + traslación)
                const v7 = noise[y * size + ((W - x + H2) % size)];  // gv
                const v8 = noise[((W - y + H2) % size) * size + x];  // gh
                
                result[y * size + x] = (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 8;
            }
        }
        
        return this.normalize(result);
    },
    
    // =====================================================
    // GRUPOS HEXAGONALES - C3, C6, D3, D6
    // Usar promedios con interpolación bilinear (igual que ImageTransform)
    // =====================================================
    
    /**
     * Interpolación bilinear - EXACTAMENTE igual que ImageTransform
     */
    sampleBilinear(data, size, x, y) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        
        if (x0 < 0 || x1 >= size || y0 < 0 || y1 >= size) {
            // Clamp to edge
            const cx = Math.max(0, Math.min(size - 1, Math.round(x)));
            const cy = Math.max(0, Math.min(size - 1, Math.round(y)));
            return data[cy * size + cx];
        }
        
        const fx = x - x0;
        const fy = y - y0;
        
        return data[y0 * size + x0] * (1 - fx) * (1 - fy) +
               data[y0 * size + x1] * fx * (1 - fy) +
               data[y1 * size + x0] * (1 - fx) * fy +
               data[y1 * size + x1] * fx * fy;
    },
    
    /**
     * Rotar coordenadas - usando EXACTAMENTE la misma fórmula que ImageTransform._rotateGeneral
     * ImageTransform usa: srcX = cos*dx + sin*dy, srcY = -sin*dx + cos*dy
     */
    rotateCoords(x, y, angleDeg, cx, cy) {
        const rad = angleDeg * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = x - cx;
        const dy = y - cy;
        // Fórmula INVERSA (igual que ImageTransform)
        return {
            x: cos * dx + sin * dy + cx,
            y: -sin * dx + cos * dy + cy
        };
    },
    
    /**
     * Reflejar coordenadas sobre un eje que pasa por el centro
     * axisAngle: ángulo del eje de reflexión desde horizontal (en grados)
     */
    reflectCoords(x, y, axisAngle, cx, cy) {
        const theta = axisAngle * Math.PI / 180;
        const dx = x - cx;
        const dy = y - cy;
        // Reflexión sobre eje a ángulo θ: 
        // x' = x*cos(2θ) + y*sin(2θ)
        // y' = x*sin(2θ) - y*cos(2θ)
        const cos2 = Math.cos(2 * theta);
        const sin2 = Math.sin(2 * theta);
        return {
            x: cos2 * dx + sin2 * dy + cx,
            y: sin2 * dx - cos2 * dy + cy
        };
    },
    
    /**
     * p3: Simetría C3 (rotación 120°)
     */
    generateP3(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const p0 = noise[y * size + x];  // e
                
                const r1 = this.rotateCoords(x, y, 120, cx, cy);
                const p1 = this.sampleBilinear(noise, size, r1.x, r1.y);  // C3
                
                const r2 = this.rotateCoords(x, y, 240, cx, cy);
                const p2 = this.sampleBilinear(noise, size, r2.x, r2.y);  // C3²
                
                result[y * size + x] = (p0 + p1 + p2) / 3;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p3m1: Simetría D3 (C3 + 3 reflexiones a 0°, 60°, 120°)
     */
    generateP3M1(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = noise[y * size + x];  // e
                
                // Rotaciones C3
                for (const angle of [120, 240]) {
                    const r = this.rotateCoords(x, y, angle, cx, cy);
                    sum += this.sampleBilinear(noise, size, r.x, r.y);
                }
                
                // Reflexiones (ejes a 90°, 150°, 210° = verticales rotados)
                for (const axisAngle of [90, 150, 210]) {
                    const m = this.reflectCoords(x, y, axisAngle, cx, cy);
                    sum += this.sampleBilinear(noise, size, m.x, m.y);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p31m: Simetría D3 con ejes de reflexión rotados 30°
     */
    generateP31M(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = noise[y * size + x];  // e
                
                // Rotaciones C3
                for (const angle of [120, 240]) {
                    const r = this.rotateCoords(x, y, angle, cx, cy);
                    sum += this.sampleBilinear(noise, size, r.x, r.y);
                }
                
                // Reflexiones (ejes a 0°, 60°, 120° = horizontales rotados)
                for (const axisAngle of [0, 60, 120]) {
                    const m = this.reflectCoords(x, y, axisAngle, cx, cy);
                    sum += this.sampleBilinear(noise, size, m.x, m.y);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p6: Simetría C6 (rotación 60°)
     */
    generateP6(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = noise[y * size + x];  // e
                
                // Rotaciones C6: 60°, 120°, 180°, 240°, 300°
                for (const angle of [60, 120, 180, 240, 300]) {
                    const r = this.rotateCoords(x, y, angle, cx, cy);
                    sum += this.sampleBilinear(noise, size, r.x, r.y);
                }
                
                result[y * size + x] = sum / 6;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p6m: Simetría D6 (C6 + 6 reflexiones) - máxima simetría
     */
    generateP6M(size, rng) {
        const noise = this.createNoise(size, rng);
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = noise[y * size + x];  // e
                
                // Rotaciones C6
                for (const angle of [60, 120, 180, 240, 300]) {
                    const r = this.rotateCoords(x, y, angle, cx, cy);
                    sum += this.sampleBilinear(noise, size, r.x, r.y);
                }
                
                // 6 reflexiones (ejes a 0°, 30°, 60°, 90°, 120°, 150°)
                for (const axisAngle of [0, 30, 60, 90, 120, 150]) {
                    const m = this.reflectCoords(x, y, axisAngle, cx, cy);
                    sum += this.sampleBilinear(noise, size, m.x, m.y);
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

// Exportar
if (typeof window !== 'undefined') {
    window.PatternGenerator = PatternGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatternGenerator;
}
