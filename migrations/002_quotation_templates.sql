-- Migration: Add quotation templates table
-- Created: 2026-04-15

-- Quotation Templates table
CREATE TABLE IF NOT EXISTS quotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'custom', 'residential', 'commercial', 'industrial', 'offgrid'
    is_preset BOOLEAN DEFAULT false,
    
    -- Template data (JSON)
    template_data JSONB NOT NULL DEFAULT '{}',
    
    -- Default components for this template
    default_components JSONB DEFAULT '[]',
    
    -- Default design settings
    default_theme VARCHAR(50) DEFAULT 'default',
    default_cover_style VARCHAR(50) DEFAULT 'centered',
    default_service_layout VARCHAR(50) DEFAULT '2col',
    default_spacing VARCHAR(50) DEFAULT 'normal',
    default_header_style VARCHAR(50) DEFAULT 'wave',
    
    -- Default project specs
    default_project_type VARCHAR(100),
    default_capacity DECIMAL(10, 2),
    default_payback_period DECIMAL(5, 2),
    
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_quotation_templates_category ON quotation_templates(category);
CREATE INDEX IF NOT EXISTS idx_quotation_templates_is_preset ON quotation_templates(is_preset);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_quotation_templates_updated_at ON quotation_templates;
CREATE TRIGGER update_quotation_templates_updated_at
    BEFORE UPDATE ON quotation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert preset templates
INSERT INTO quotation_templates (
    template_id, name, description, category, is_preset, 
    default_project_type, default_capacity, default_payback_period,
    default_theme, default_cover_style, default_components
) VALUES 
(
    'tmpl-residential-std',
    'Residential Standard',
    'Standard residential rooftop solar installation with common components',
    'residential',
    true,
    'Residential Rooftop',
    5.0,
    4.5,
    'forest',
    'centered',
    '[
        {"id":"1","particulars":"Solar Panels - 555W Mono PERC","quantity":"9 Nos","description":"High-efficiency monocrystalline solar panels with 21% efficiency rating.","category":"panels","icon":"☀️","unitPrice":18500,"markup":15,"isOptional":false},
        {"id":"2","particulars":"Solar Inverter - 5kW Hybrid","quantity":"1 No","description":"5kW grid-tie solar inverter with MPPT technology and WiFi monitoring.","category":"inverters","icon":"⚡","unitPrice":45000,"markup":12,"isOptional":false},
        {"id":"3","particulars":"Mounting Structure","quantity":"1 Set","description":"Aluminum anodized structure with hot-dip galvanized MS supports.","category":"mounting","icon":"🔧","unitPrice":25000,"markup":20,"isOptional":false},
        {"id":"4","particulars":"DC Combiner Box","quantity":"1 No","description":"IP65 rated with SPD, DC MCB and monitoring.","category":"electrical","icon":"🔌","unitPrice":8000,"markup":25,"isOptional":false},
        {"id":"5","particulars":"DC & AC Wires/Cables","quantity":"Included","description":"Polycab/Finolex solar-grade cables with proper sizing.","category":"electrical","icon":"🔌","unitPrice":12000,"markup":20,"isOptional":false},
        {"id":"6","particulars":"Lightning Arrester","quantity":"1 No","description":"Class B+C lightning protection system.","category":"accessories","icon":"⚡","unitPrice":3500,"markup":30,"isOptional":true}
    ]'
),
(
    'tmpl-commercial-std',
    'Commercial Standard',
    'Commercial installation for offices and small businesses',
    'commercial',
    true,
    'Commercial Rooftop',
    25.0,
    3.8,
    'ocean',
    'modern-card',
    '[
        {"id":"1","particulars":"Solar Panels - 550W Mono PERC","quantity":"46 Nos","description":"High-efficiency commercial grade panels with 21.2% efficiency.","category":"panels","icon":"☀️","unitPrice":16000,"markup":15,"isOptional":false},
        {"id":"2","particulars":"Solar Inverter - 25kW String","quantity":"1 No","description":"25kW 3-phase string inverter with 98.6% efficiency.","category":"inverters","icon":"⚡","unitPrice":185000,"markup":10,"isOptional":false},
        {"id":"3","particulars":"Mounting Structure","quantity":"1 Set","description":"Heavy-duty aluminum structure for 150km/h wind loads.","category":"mounting","icon":"🔧","unitPrice":95000,"markup":18,"isOptional":false},
        {"id":"4","particulars":"DC Combiner Boxes","quantity":"2 Nos","description":"IP65 rated with string monitoring, SPD protection.","category":"electrical","icon":"🔌","unitPrice":25000,"markup":22,"isOptional":false},
        {"id":"5","particulars":"AC Distribution Panel","quantity":"1 No","description":"ACDB with MCCB, SPD, and energy meter.","category":"electrical","icon":"🔌","unitPrice":35000,"markup":20,"isOptional":false},
        {"id":"6","particulars":"Cables & Connectors","quantity":"Complete Set","description":"Solar grade DC and AC power cables.","category":"electrical","icon":"🔌","unitPrice":85000,"markup":18,"isOptional":false},
        {"id":"7","particulars":"Online Monitoring System","quantity":"1 Set","description":"SCADA based remote monitoring with app access.","category":"accessories","icon":"📡","unitPrice":25000,"markup":25,"isOptional":true}
    ]'
),
(
    'tmpl-industrial-std',
    'Industrial Standard',
    'Large scale industrial installation with high capacity',
    'industrial',
    true,
    'Industrial Rooftop',
    100.0,
    3.2,
    'royal',
    'left-aligned',
    '[
        {"id":"1","particulars":"Solar Panels - 550W Mono PERC","quantity":"182 Nos","description":"Industrial grade panels with 21.5% efficiency.","category":"panels","icon":"☀️","unitPrice":15500,"markup":12,"isOptional":false},
        {"id":"2","particulars":"Solar Inverters - 50kW","quantity":"2 Nos","description":"50kW 3-phase inverters with 98.8% efficiency.","category":"inverters","icon":"⚡","unitPrice":320000,"markup":8,"isOptional":false},
        {"id":"3","particulars":"Mounting Structure","quantity":"1 Set","description":"Hot-dip galvanized structure for 180km/h wind.","category":"mounting","icon":"🔧","unitPrice":350000,"markup":15,"isOptional":false},
        {"id":"4","particulars":"DC Combiner Boxes","quantity":"8 Nos","description":"Multi-string DC boxes with monitoring.","category":"electrical","icon":"🔌","unitPrice":18000,"markup":20,"isOptional":false},
        {"id":"5","particulars":"AC Distribution Panel","quantity":"1 No","description":"LT panel with VCB and protection relays.","category":"electrical","icon":"🔌","unitPrice":85000,"markup":18,"isOptional":false},
        {"id":"6","particulars":"HT/LT Transformer","quantity":"As Required","description":"Step-up/down transformer per DISCOM.","category":"electrical","icon":"⚡","unitPrice":150000,"markup":15,"isOptional":true},
        {"id":"7","particulars":"Cables & Accessories","quantity":"Complete Set","description":"All DC/AC cables and termination kits.","category":"electrical","icon":"🔌","unitPrice":280000,"markup":15,"isOptional":false},
        {"id":"8","particulars":"SCADA System","quantity":"1 Set","description":"Complete monitoring and control system.","category":"accessories","icon":"📊","unitPrice":75000,"markup":20,"isOptional":true}
    ]'
),
(
    'tmpl-offgrid-std',
    'Off-Grid Standard',
    'Off-grid solar system with battery backup for remote locations',
    'offgrid',
    true,
    'Off-Grid Solar System',
    3.0,
    5.5,
    'sunset',
    'minimal',
    '[
        {"id":"1","particulars":"Solar Panels - 400W Mono","quantity":"8 Nos","description":"High-efficiency panels for battery charging.","category":"panels","icon":"☀️","unitPrice":12000,"markup":18,"isOptional":false},
        {"id":"2","particulars":"Off-Grid Inverter - 3kW","quantity":"1 No","description":"3kW pure sine wave with MPPT controller.","category":"inverters","icon":"⚡","unitPrice":45000,"markup":15,"isOptional":false},
        {"id":"3","particulars":"Battery Bank - 150Ah","quantity":"4 Nos","description":"150Ah tubular batteries, 5-year warranty.","category":"batteries","icon":"🔋","unitPrice":18000,"markup":20,"isOptional":false},
        {"id":"4","particulars":"Mounting Structure","quantity":"1 Set","description":"Aluminum structure with foundation bolts.","category":"mounting","icon":"🔧","unitPrice":15000,"markup":22,"isOptional":false},
        {"id":"5","particulars":"DC Cables & Accessories","quantity":"Complete Set","description":"DC cables, connectors, fuses, battery interconnects.","category":"electrical","icon":"🔌","unitPrice":8000,"markup":25,"isOptional":false},
        {"id":"6","particulars":"Battery Rack","quantity":"1 Set","description":" powder coated battery rack with insulation.","category":"accessories","icon":"⚙️","unitPrice":4500,"markup":30,"isOptional":true}
    ]'
)
ON CONFLICT (template_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_components = EXCLUDED.default_components;
