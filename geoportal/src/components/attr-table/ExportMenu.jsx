import { Dropdown, Button } from 'antd';
import { DownloadOutlined, FileTextOutlined, GlobalOutlined } from '@ant-design/icons';
import useStore from '../../store';
import { exportCSV, exportGeoJSON } from './utils';

export default function ExportMenu({ filteredData }) {
    const selectedRowKeys = useStore((s) => s.selectedRowKeys);
    const attrTableGeometries = useStore((s) => s.attrTableGeometries);
    const attrTableLayer = useStore((s) => s.attrTableLayer);

    const layerName = attrTableLayer?.title || 'export';
    const hasSelection = selectedRowKeys.length > 0;

    const getSelectedRows = () => filteredData.filter((r) => selectedRowKeys.includes(r._key));

    const items = [
        {
            key: 'csv-selected',
            icon: <FileTextOutlined />,
            label: `CSV (${hasSelection ? `выбранных: ${selectedRowKeys.length}` : 'отфильтрованных'})`,
            onClick: () => {
                const rows = hasSelection ? getSelectedRows() : filteredData;
                exportCSV(rows, `${layerName}.csv`);
            },
        },
        {
            key: 'geojson-selected',
            icon: <GlobalOutlined />,
            label: `GeoJSON (${hasSelection ? `выбранных: ${selectedRowKeys.length}` : 'отфильтрованных'})`,
            onClick: () => {
                const rows = hasSelection ? getSelectedRows() : filteredData;
                exportGeoJSON(rows, attrTableGeometries, `${layerName}.geojson`);
            },
        },
        { type: 'divider' },
        {
            key: 'csv-all',
            icon: <FileTextOutlined />,
            label: `CSV (все отфильтрованные: ${filteredData.length})`,
            onClick: () => exportCSV(filteredData, `${layerName}.csv`),
        },
        {
            key: 'geojson-all',
            icon: <GlobalOutlined />,
            label: `GeoJSON (все отфильтрованные: ${filteredData.length})`,
            onClick: () => exportGeoJSON(filteredData, attrTableGeometries, `${layerName}.geojson`),
        },
    ];

    return (
        <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" icon={<DownloadOutlined />} title="Экспорт">
                Экспорт
            </Button>
        </Dropdown>
    );
}
