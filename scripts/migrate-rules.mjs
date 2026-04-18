import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse env manually to avoid dotenv dependency issues in ts-node
const envContent = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log("Starting migration...");

    // 1. Fetch all rules
    const { data: rules, error } = await supabase.from('rules').select('id, rule_text');
    if (error) {
        console.error("Error fetching rules:", error);
        return;
    }

    // 2. Identify rules to delete
    const toDelete = rules.filter(r => r.rule_text.includes('RULETA:') || r.rule_text.startsWith('RULETA_JSON:'));
    
    if (toDelete.length > 0) {
        const idsToDelete = toDelete.map(r => r.id);
        console.log(`Deleting ${idsToDelete.length} roulette-related rules...`);
        let start = 0;
        const chunkSize = 50;
        while(start < idsToDelete.length) {
            await supabase.from('rules').delete().in('id', idsToDelete.slice(start, start + chunkSize));
            start += chunkSize;
        }
    }

    // 3. Add the regular general rule
    const newGeneralRule = "Curar cuando el rival/lider de gimnasio o entrenadores de eventos no lo han hecho resta -40 puntos.";
    if (!rules.some(r => r.rule_text === newGeneralRule)) {
        console.log("Adding new general rule (-40 points)...");
        await supabase.from('rules').insert([{ rule_text: newGeneralRule }]);
    }

    console.log("Migration complete!");
}

migrate();
