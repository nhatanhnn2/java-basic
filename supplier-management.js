// Quản lý nhà cung cấp - Module xử lý thứ tự ưu tiên
class SupplierManager {
    constructor() {
        this.suppliers = []; // Danh sách nhà cung cấp hiện tại
    }

    /**
     * Kiểm tra trùng lặp thứ tự ưu tiên
     * @param {number} priority - Thứ tự ưu tiên cần kiểm tra
     * @param {string} domain - Miền ưu tiên (có thể là loại hàng hóa, khu vực, etc.)
     * @returns {Object|null} - Trả về NCC trùng lặp hoặc null
     */
    checkPriorityDuplicate(priority, domain = 'default') {
        return this.suppliers.find(supplier => 
            supplier.priority === priority && 
            supplier.domain === domain &&
            supplier.isActive
        );
    }

    /**
     * Dịch chuyển thứ tự ưu tiên của các NCC
     * @param {number} fromPriority - Từ thứ tự ưu tiên nào
     * @param {string} domain - Miền ưu tiên
     */
    shiftPriorities(fromPriority, domain = 'default') {
        this.suppliers
            .filter(supplier => 
                supplier.priority >= fromPriority && 
                supplier.domain === domain &&
                supplier.isActive
            )
            .forEach(supplier => {
                supplier.priority += 1;
            });
    }

    /**
     * Thêm nhà cung cấp mới với kiểm tra thứ tự ưu tiên
     * @param {Object} supplierData - Dữ liệu nhà cung cấp
     * @returns {Promise<Object>} - Kết quả thêm NCC
     */
    async addSupplier(supplierData) {
        const { name, priority, domain = 'default', importPrice, ...otherData } = supplierData;

        try {
            // Kiểm tra trùng lặp thứ tự ưu tiên
            const duplicateSupplier = this.checkPriorityDuplicate(priority, domain);
            
            if (duplicateSupplier) {
                // Hiển thị dialog xác nhận ghi đè
                const shouldOverride = await this.showConfirmationDialog(
                    duplicateSupplier, 
                    priority, 
                    domain
                );

                if (!shouldOverride) {
                    return {
                        success: false,
                        message: 'Người dùng hủy thao tác thêm nhà cung cấp',
                        code: 'USER_CANCELLED'
                    };
                }

                // Nếu đồng ý ghi đè, dịch chuyển thứ tự ưu tiên
                this.shiftPriorities(priority, domain);
                
                console.log(`Đã dịch chuyển thứ tự ưu tiên từ ${priority} trở lên trong miền '${domain}'`);
            }

            // Thêm nhà cung cấp mới
            const newSupplier = {
                id: this.generateSupplierId(),
                name,
                priority,
                domain,
                importPrice,
                isActive: true,
                createdAt: new Date(),
                ...otherData
            };

            this.suppliers.push(newSupplier);

            // Sắp xếp lại danh sách theo thứ tự ưu tiên
            this.sortSuppliersByPriority(domain);

            return {
                success: true,
                message: 'Thêm nhà cung cấp thành công',
                data: newSupplier,
                code: 'SUCCESS'
            };

        } catch (error) {
            console.error('Lỗi khi thêm nhà cung cấp:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi thêm nhà cung cấp',
                error: error.message,
                code: 'ERROR'
            };
        }
    }

    /**
     * Hiển thị dialog xác nhận ghi đè
     * @param {Object} existingSupplier - NCC hiện tại có cùng thứ tự ưu tiên
     * @param {number} priority - Thứ tự ưu tiên
     * @param {string} domain - Miền ưu tiên
     * @returns {Promise<boolean>} - True nếu người dùng đồng ý ghi đè
     */
    async showConfirmationDialog(existingSupplier, priority, domain) {
        const message = `Đã tồn tại thứ tự ưu tiên ${priority} ứng với miền ưu tiên "${domain}" (NCC: ${existingSupplier.name}). Bạn có muốn ghi đè không?\n\nLưu ý: Thứ tự ưu tiên của các nhà cung cấp khác sẽ được dịch chuyển tăng thêm 1.`;
        
        // Trong môi trường thực tế, bạn sẽ sử dụng modal/dialog component
        // Ở đây tôi dùng confirm đơn giản để minh họa
        return new Promise((resolve) => {
            // Mô phỏng dialog async
            setTimeout(() => {
                const result = confirm(message);
                resolve(result);
            }, 100);
        });
    }

    /**
     * Sắp xếp nhà cung cấp theo thứ tự ưu tiên
     * @param {string} domain - Miền ưu tiên cần sắp xếp
     */
    sortSuppliersByPriority(domain = null) {
        this.suppliers.sort((a, b) => {
            if (domain && (a.domain !== domain || b.domain !== domain)) {
                return 0; // Không thay đổi thứ tự nếu không cùng domain
            }
            return a.priority - b.priority;
        });
    }

    /**
     * Tạo ID cho nhà cung cấp mới
     * @returns {string} - ID duy nhất
     */
    generateSupplierId() {
        return 'SUP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Lấy danh sách nhà cung cấp theo domain
     * @param {string} domain - Miền ưu tiên
     * @returns {Array} - Danh sách NCC
     */
    getSuppliersByDomain(domain = 'default') {
        return this.suppliers
            .filter(supplier => supplier.domain === domain && supplier.isActive)
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Cập nhật thứ tự ưu tiên của NCC
     * @param {string} supplierId - ID nhà cung cấp
     * @param {number} newPriority - Thứ tự ưu tiên mới
     * @returns {Promise<Object>} - Kết quả cập nhật
     */
    async updateSupplierPriority(supplierId, newPriority) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        
        if (!supplier) {
            return {
                success: false,
                message: 'Không tìm thấy nhà cung cấp',
                code: 'NOT_FOUND'
            };
        }

        const oldPriority = supplier.priority;
        const domain = supplier.domain;

        // Kiểm tra trùng lặp với thứ tự ưu tiên mới
        const duplicateSupplier = this.checkPriorityDuplicate(newPriority, domain);
        
        if (duplicateSupplier && duplicateSupplier.id !== supplierId) {
            const shouldOverride = await this.showConfirmationDialog(
                duplicateSupplier, 
                newPriority, 
                domain
            );

            if (!shouldOverride) {
                return {
                    success: false,
                    message: 'Người dùng hủy thao tác cập nhật',
                    code: 'USER_CANCELLED'
                };
            }

            // Dịch chuyển thứ tự ưu tiên
            this.shiftPriorities(newPriority, domain);
        }

        // Cập nhật thứ tự ưu tiên
        supplier.priority = newPriority;
        supplier.updatedAt = new Date();

        // Sắp xếp lại
        this.sortSuppliersByPriority(domain);

        return {
            success: true,
            message: 'Cập nhật thứ tự ưu tiên thành công',
            data: supplier,
            code: 'SUCCESS'
        };
    }
}

// Ví dụ sử dụng
const supplierManager = new SupplierManager();

// Export để sử dụng ở nơi khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupplierManager;
}

// Ví dụ test function
async function testSupplierPriority() {
    console.log('=== Test Supplier Priority Management ===');
    
    // Thêm NCC đầu tiên
    const result1 = await supplierManager.addSupplier({
        name: 'NCC A',
        priority: 1,
        domain: 'electronics',
        importPrice: 100000
    });
    console.log('Thêm NCC A:', result1);

    // Thêm NCC thứ hai với cùng thứ tự ưu tiên (sẽ trigger dialog)
    const result2 = await supplierManager.addSupplier({
        name: 'NCC B',
        priority: 1,
        domain: 'electronics',
        importPrice: 95000
    });
    console.log('Thêm NCC B:', result2);

    // Hiển thị danh sách NCC sau khi thêm
    console.log('Danh sách NCC electronics:', 
        supplierManager.getSuppliersByDomain('electronics')
    );
}

// Uncomment để test
// testSupplierPriority();