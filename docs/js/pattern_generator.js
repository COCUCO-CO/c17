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
    // Usar coordenadas polares para simetría exacta
    // =====================================================
    
    /**
     * Generar ruido en coordenadas polares con simetría angular
     */
    createPolarNoise(size, rng, nFold, hasReflection, complexity = 4) {
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        const maxR = Math.sqrt(cx * cx + cy * cy);
        
        // Crear ondas radiales y angulares con la simetría deseada
        const waves = [];
        for (let k = 0; k < complexity; k++) {
            waves.push({
                rFreq: rng() * 8 + 1,      // frecuencia radial
                rPhase: rng() * Math.PI * 2,
                aFreq: Math.floor(rng() * 3) * nFold,  // múltiplo de nFold para simetría
                aPhase: rng() * Math.PI * 2,
                amplitude: rng() * 0.5 + 0.5
            });
        }
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy) / maxR;
                let theta = Math.atan2(dy, dx);
                if (theta < 0) theta += 2 * Math.PI;
                
                // Si hay reflexión, usar |sin| o |cos| para hacer par
                let value = 0;
                for (const wave of waves) {
                    const radial = Math.sin(wave.rFreq * r * Math.PI + wave.rPhase);
                    let angular;
                    if (hasReflection) {
                        // Función par respecto al eje de reflexión
                        angular = Math.cos(wave.aFreq * theta + wave.aPhase);
                    } else {
                        // Función general con simetría rotacional
                        angular = Math.sin(wave.aFreq * theta + wave.aPhase);
                    }
                    value += wave.amplitude * radial * angular;
                }
                
                result[y * size + x] = value;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p3: Simetría C3 (rotación 120°)
     */
    generateP3(size, rng) {
        return this.createPolarNoise(size, rng, 3, false);
    },
    
    /**
     * p3m1: Simetría D3 (C3 + reflexiones)
     */
    generateP3M1(size, rng) {
        return this.createPolarNoise(size, rng, 3, true);
    },
    
    /**
     * p31m: También D3 pero con ejes de reflexión rotados 30°
     */
    generateP31M(size, rng) {
        // Mismo grupo puntual D3, diferente orientación de los ejes
        const result = new Float32Array(size * size);
        const cx = (size - 1) / 2;
        const cy = (size - 1) / 2;
        const maxR = Math.sqrt(cx * cx + cy * cy);
        
        const waves = [];
        for (let k = 0; k < 4; k++) {
            waves.push({
                rFreq: rng() * 8 + 1,
                rPhase: rng() * Math.PI * 2,
                aFreq: Math.floor(rng() * 3) * 3,
                aPhase: rng() * Math.PI * 2,
                amplitude: rng() * 0.5 + 0.5
            });
        }
        
        // Offset de 30° para p31m vs p3m1
        const axisOffset = Math.PI / 6;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy) / maxR;
                let theta = Math.atan2(dy, dx) - axisOffset;
                if (theta < 0) theta += 2 * Math.PI;
                
                let value = 0;
                for (const wave of waves) {
                    const radial = Math.sin(wave.rFreq * r * Math.PI + wave.rPhase);
                    const angular = Math.cos(wave.aFreq * theta + wave.aPhase);
                    value += wave.amplitude * radial * angular;
                }
                
                result[y * size + x] = value;
            }
        }
        
        return this.normalize(result);
    },
    
    /**
     * p6: Simetría C6 (rotación 60°)
     */
    generateP6(size, rng) {
        return this.createPolarNoise(size, rng, 6, false);
    },
    
    /**
     * p6m: Simetría D6 (C6 + reflexiones) - máxima simetría
     */
    generateP6M(size, rng) {
        return this.createPolarNoise(size, rng, 6, true);
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
