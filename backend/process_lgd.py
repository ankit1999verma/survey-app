import pandas as pd
import numpy as np
import os

print("Loading File 1...")
df = pd.read_excel('/Users/ankitverma/Downloads/SurveyApp/Subdistrict_Village_Block_Gps_Mapping_2026-07-02_00-02-49.xlsx', skiprows=1)

print("Extracting Blocks...")
blocks_df = df[['State Name (In English)', 'District Name of Development Block (In English)', 'Development Block Code', 'Development Block Name  (In English)']].dropna().drop_duplicates()
blocks_df.columns = ['state_name', 'district_name', 'block_code', 'block_name']
blocks_df.to_csv('/Users/ankitverma/Downloads/SurveyApp/backend/data/lgd-blocks.csv', index=False)
print(f"Saved {len(blocks_df)} blocks.")

print("Extracting GPs...")
gps_df = df[['State Name (In English)', 'District Name of Development Block (In English)', 'Development Block Name  (In English)', 'Local Body Code', 'Local Body Name (In English)']].dropna().drop_duplicates()
gps_df.columns = ['state_name', 'district_name', 'block_name', 'gp_code', 'gp_name']
gps_df.to_csv('/Users/ankitverma/Downloads/SurveyApp/backend/data/lgd-gps.csv', index=False)
print(f"Saved {len(gps_df)} GPs.")
